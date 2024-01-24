# Building
npm run build OR tsc build

Module is not published to npm yet, however, you can use it by installing it from local path after build

npm install ```path-to-this-directory```

# Usage example

    import { DashTech, Player } from 'nas-player';

    player = new Player();
    player.init(
        new DashTech(),
        video_element,
        "https://dash.akamaized.net/dash264/TestCases/1a/sony/SNE_DASH_SD_CASE1A_REVISED.mpd",
        true,
        false,
        { "X-Custom-Header": "test" },
        {
            "com.widevine.alpha": {
                "serverURL": "<license URL if needed>",
                "httpRequestHeaders": { "X-Custom-Header": "test" }
            }
        },
        (e: any) => {
            console.error('DRM License Error: ' + e.message);
        }
    );

When switching streams remember to destroy the player by using destroy() method on player object and recreate the player.