#!/data/data/com.termux/files/usr/bin/bash

set -u

BASE="http://127.0.0.1:5000/api/v1"
TMP="$HOME/codem/.audit-tmp"
SERVER_LOG="$TMP/live-server.log"

mkdir -p "$TMP"

PASS=0
FAIL=0
SERVER_PID=""

cleanup() {
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT

pass() {
    PASS=$((PASS + 1))
    echo "PASS: $1"
}

fail() {
    FAIL=$((FAIL + 1))
    echo "FAIL: $1"
}

request() {
    local method="$1"
    local url="$2"
    local body="${3:-}"
    local token="${4:-}"

    if [ -z "$url" ]; then
        echo "REQUEST ERROR: URL is empty" >&2
        return 2
    fi

    local args=(
        -sS
        -X "$method"
        "$url"
        -o "$TMP/response.json"
        -w "%{http_code}"
    )

    if [ -n "$body" ]; then
        args+=(
            -H "Content-Type: application/json"
            --data "$body"
        )
    fi

    if [ -n "$token" ]; then
        args+=(
            -H "Authorization: Bearer $token"
        )
    fi

    curl "${args[@]}"
}

json_value() {
    python - "$TMP/response.json" "$1" <<'PY'
import json
import sys

path = sys.argv[2].split(".")
with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)

value = data

for key in path:
    if isinstance(value, dict):
        value = value.get(key)
    else:
        value = None
        break

if value is not None:
    print(value)
PY
}

echo
echo "============================================================"
echo "CODEM LIVE INTEGRATION + SECURITY TEST"
echo "============================================================"
echo

echo "[1/10] Starting backend..."

cd "$HOME/codem/backend"

node src/server.js > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

sleep 2

if kill -0 "$SERVER_PID" 2>/dev/null; then
    pass "Backend process started"
else
    fail "Backend failed to start"
    cat "$SERVER_LOG"
    exit 1
fi

echo
echo "[2/10] Health check..."

HTTP=$(curl -sS \
    -o "$TMP/health.json" \
    -w "%{http_code}" \
    "$BASE/health" 2>/dev/null || echo "000")

if [ "$HTTP" = "200" ]; then
    pass "Health endpoint returned HTTP 200"
else
    fail "Health endpoint returned HTTP $HTTP"
    cat "$TMP/health.json" 2>/dev/null || true
fi

echo
echo "[3/10] Creating temporary test users..."

TIMESTAMP=$(date +%s)

USER1_EMAIL="codem.integration.owner.${TIMESTAMP}@example.test"
USER2_EMAIL="codem.integration.other.${TIMESTAMP}@example.test"

USER1_PASSWORD="CodemTest!${TIMESTAMP}A"
USER2_PASSWORD="CodemTest!${TIMESTAMP}B"

BODY1=$(python - <<PY
import json
print(json.dumps({
    "email": "$USER1_EMAIL",
    "username": "codemowner${TIMESTAMP}",
    "password": "$USER1_PASSWORD"
}))
PY
)

BODY2=$(python - <<PY
import json
print(json.dumps({
    "email": "$USER2_EMAIL",
    "username": "codemother${TIMESTAMP}",
    "password": "$USER2_PASSWORD"
}))
PY
)

HTTP1=$(request POST "$BASE/auth/register" "$BODY1")

if [ "$HTTP1" = "201" ] || [ "$HTTP1" = "200" ]; then
    USER1_TOKEN=$(json_value "data.token")
    [ -z "$USER1_TOKEN" ] && USER1_TOKEN=$(json_value "token")
    USER1_ID=$(json_value "data.user.id")
    [ -z "$USER1_ID" ] && USER1_ID=$(json_value "user.id")
    [ -z "$USER1_ID" ] && USER1_ID=$(json_value "data.id")
    [ -z "$USER1_ID" ] && USER1_ID=$(json_value "id")

    if [ -n "$USER1_TOKEN" ] && [ -n "$USER1_ID" ]; then
        pass "Owner test user created"
    else
        fail "Owner registration succeeded but response shape was unexpected"
        cat "$TMP/response.json"
        exit 1
    fi
else
    fail "Owner registration returned HTTP $HTTP1"
    cat "$TMP/response.json"
    exit 1
fi

HTTP2=$(request POST "$BASE/auth/register" "$BODY2")

if [ "$HTTP2" = "201" ] || [ "$HTTP2" = "200" ]; then
    USER2_TOKEN=$(json_value "data.token")
    [ -z "$USER2_TOKEN" ] && USER2_TOKEN=$(json_value "token")
    USER2_ID=$(json_value "data.user.id")
    [ -z "$USER2_ID" ] && USER2_ID=$(json_value "user.id")
    [ -z "$USER2_ID" ] && USER2_ID=$(json_value "data.id")
    [ -z "$USER2_ID" ] && USER2_ID=$(json_value "id")

    if [ -n "$USER2_TOKEN" ] && [ -n "$USER2_ID" ]; then
        pass "Second test user created"
    else
        fail "Second registration succeeded but response shape was unexpected"
        cat "$TMP/response.json"
        exit 1
    fi
else
    fail "Second user registration returned HTTP $HTTP2"
    cat "$TMP/response.json"
    exit 1
fi

echo
echo "[4/10] Testing developer endpoints..."

HTTP=$(request GET "$BASE/developers/$USER1_ID" "" "$USER1_TOKEN")

if [ "$HTTP" = "200" ]; then
    pass "Developer profile GET works"
else
    fail "Developer profile GET returned HTTP $HTTP"
fi

HTTP=$(request GET "$BASE/developers/skills/$USER1_ID" "" "$USER1_TOKEN")

if [ "$HTTP" = "200" ]; then
    pass "Developer skills GET works"
else
    fail "Developer skills GET returned HTTP $HTTP"
fi

HTTP=$(request GET "$BASE/developers/me/dashboard" "" "$USER1_TOKEN")

if [ "$HTTP" = "200" ]; then
    pass "Developer dashboard works"
else
    fail "Developer dashboard returned HTTP $HTTP"
fi

echo
echo "[5/10] Testing authentication protection..."

HTTP=$(request GET "$BASE/developers/$USER1_ID")

if [ "$HTTP" = "401" ]; then
    pass "Developer profile rejects unauthenticated access"
else
    fail "Developer profile returned HTTP $HTTP without authentication"
fi

HTTP=$(request GET "$BASE/developers/me/dashboard")

if [ "$HTTP" = "401" ]; then
    pass "Dashboard rejects unauthenticated access"
else
    fail "Dashboard returned HTTP $HTTP without authentication"
fi

echo
echo "[6/10] Creating private project..."

PROJECT_BODY=$(python - <<PY
import json
print(json.dumps({
    "name": "Codem Integration Private ${TIMESTAMP}",
    "description": "Temporary integration test project",
    "visibility": "private"
}))
PY
)

HTTP=$(request POST "$BASE/projects" "$PROJECT_BODY" "$USER1_TOKEN")

if [ "$HTTP" = "201" ] || [ "$HTTP" = "200" ]; then
    PROJECT_ID=$(json_value "data.id")
    [ -z "$PROJECT_ID" ] && PROJECT_ID=$(json_value "id")

    if [ -n "$PROJECT_ID" ]; then
        pass "Private project created"
    else
        fail "Project creation succeeded but project ID was not found"
        cat "$TMP/response.json"
        exit 1
    fi
else
    fail "Private project creation returned HTTP $HTTP"
    cat "$TMP/response.json"
    exit 1
fi

echo
echo "[7/10] Testing private project access..."

HTTP=$(request GET "$BASE/projects/$PROJECT_ID" "" "$USER1_TOKEN")

if [ "$HTTP" = "200" ]; then
    pass "Project owner can access private project"
else
    fail "Project owner received HTTP $HTTP"
fi

HTTP=$(request GET "$BASE/projects/$PROJECT_ID" "" "$USER2_TOKEN")

if [ "$HTTP" = "403" ]; then
    pass "Non-member cannot access private project"
else
    fail "Private project leaked to second user with HTTP $HTTP"
fi

HTTP=$(request GET "$BASE/projects/public")

if [ "$HTTP" = "200" ]; then
    pass "Public project listing works"
else
    fail "Public project listing returned HTTP $HTTP"
fi

echo
echo "[8/10] Testing project member access..."

HTTP=$(request GET "$BASE/projects/members/$PROJECT_ID" "" "$USER1_TOKEN")

if [ "$HTTP" = "200" ]; then
    pass "Owner can access project members"
else
    fail "Owner members request returned HTTP $HTTP"
fi

HTTP=$(request GET "$BASE/projects/members/$PROJECT_ID" "" "$USER2_TOKEN")

if [ "$HTTP" = "403" ]; then
    pass "Non-member cannot access private project members"
else
    fail "Private project members leaked with HTTP $HTTP"
fi

echo
echo "[9/10] Testing project file access and ownership..."

HTTP=$(request GET "$BASE/projects/files/$PROJECT_ID" "" "$USER1_TOKEN")

if [ "$HTTP" = "200" ]; then
    pass "Owner can access project files"
else
    fail "Owner project files request returned HTTP $HTTP"
fi

HTTP=$(request GET "$BASE/projects/files/$PROJECT_ID" "" "$USER2_TOKEN")

if [ "$HTTP" = "403" ]; then
    pass "Non-member cannot access private project files"
else
    fail "Private project files leaked with HTTP $HTTP"
fi

UPDATE_BODY=$(python - <<PY
import json
print(json.dumps({
    "name": "Unauthorized Update Attempt"
}))
PY
)

HTTP=$(request PATCH "$BASE/projects/$PROJECT_ID" "$UPDATE_BODY" "$USER2_TOKEN")

if [ "$HTTP" = "403" ]; then
    pass "Non-owner cannot update project"
else
    fail "Non-owner project update returned HTTP $HTTP"
fi

HTTP=$(request DELETE "$BASE/projects/$PROJECT_ID" "" "$USER2_TOKEN")

if [ "$HTTP" = "403" ]; then
    pass "Non-owner cannot delete project"
else
    fail "Non-owner project delete returned HTTP $HTTP"
fi

echo
echo "[10/10] Cleaning temporary test data..."

# Delete project as owner.
HTTP=$(request DELETE "$BASE/projects/$PROJECT_ID" "" "$USER1_TOKEN")

if [ "$HTTP" = "200" ] || [ "$HTTP" = "204" ]; then
    pass "Temporary project removed"
else
    fail "Temporary project cleanup returned HTTP $HTTP"
fi

# Revoke owner sessions.
request POST "$BASE/auth/logout-all" "" "$USER1_TOKEN" >/dev/null 2>&1 || true

# Revoke second-user sessions.
request POST "$BASE/auth/logout-all" "" "$USER2_TOKEN" >/dev/null 2>&1 || true

echo
echo "============================================================"
echo "RESULT"
echo "============================================================"
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo

if [ "$FAIL" -eq 0 ]; then
    echo "STATUS: CODEM LIVE INTEGRATION + SECURITY TEST PASSED"
    exit 0
else
    echo "STATUS: CODEM LIVE INTEGRATION + SECURITY TEST FAILED"
    echo
    echo "Server log:"
    cat "$SERVER_LOG"
    exit 1
fi
