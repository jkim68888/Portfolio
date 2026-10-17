#!/bin/sh
# 인증 프록시를 로그인 시 자동 실행하고, 꺼지면 다시 띄우도록 launchd에 등록한다.
# 사용법: sh local-llm/install-launchd.sh   (해제: sh local-llm/install-launchd.sh uninstall)
# - caffeinate -s로 감싸서 전원이 연결된 동안 Mac이 잠자기에 들어가지 않게 한다(sudo 불필요).
#   덮개를 닫으면 잠자기에 들어가고, 그동안 챗봇은 자동으로 클라우드로 답한다.
# - Ollama는 brew services(homebrew.mxcl.ollama)가, Tailscale은 앱의 로그인 항목이 따로 띄운다.
set -eu

LABEL="com.portfolio.llm-proxy"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node)"
LOG="$HOME/Library/Logs/$LABEL.log"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
if [ "${1:-}" = "uninstall" ]; then
  rm -f "$PLIST"
  echo "해제: $LABEL"
  exit 0
fi

if [ ! -f "$REPO/local-llm/.env" ]; then
  echo "local-llm/.env가 없습니다. local-llm/.env.example을 복사해 비밀키를 채워 주세요." >&2
  exit 1
fi

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/caffeinate</string>
    <string>-s</string>
    <string>$NODE</string>
    <string>--env-file=$REPO/local-llm/.env</string>
    <string>$REPO/local-llm/proxy.mjs</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$REPO</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$LOG</string>
  <key>StandardErrorPath</key>
  <string>$LOG</string>
</dict>
</plist>
EOF

launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "등록: $LABEL (로그: $LOG)"
