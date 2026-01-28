import base64
import uuid
import os

APP_NAME = "Tuba Finances"
APP_URL = "https://tuba-finances.vercel.app/"
APP_ID = "com.tuba.finances"
ICON_PATH = "icons/tuba-icon-512.png"
OUTPUT_FILE = "tuba.mobileconfig"


def generate_profile():
    if os.path.exists(ICON_PATH):
        with open(ICON_PATH, "rb") as img_file:
            icon_base64 = base64.b64encode(img_file.read()).decode("utf-8")
    else:
        print(f"Warning: Icon not found at {ICON_PATH}. Profile will have no icon.")
        icon_base64 = ""

    payload_uuid = str(uuid.uuid4()).upper()
    profile_uuid = str(uuid.uuid4()).upper()

    config_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>{APP_NAME}</string>
            <key>PayloadDescription</key>
            <string>Configures Web Clip</string>
            <key>PayloadDisplayName</key>
            <string>{APP_NAME}</string>
            <key>PayloadIdentifier</key>
            <string>{APP_ID}.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>{payload_uuid}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>{APP_URL}</string>
            <key>Icon</key>
            <data>
            {icon_base64}
            </data>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>{APP_NAME} Installer</string>
    <key>PayloadIdentifier</key>
    <string>{APP_ID}.profile</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>{profile_uuid}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>"""

    with open(OUTPUT_FILE, "w") as f:
        f.write(config_xml)

    print(f"Successfully generated {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_profile()
