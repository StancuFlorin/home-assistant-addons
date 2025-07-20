# HA Picture Element Editor Addon

This addon provides a visual editor for arranging elements on the [Home Assistant Picture Elements Card](https://www.home-assistant.io/lovelace/picture-elements/).

## Features

- **Drag and Drop Interface:** Easily arrange, move, and resize elements on your picture elements card using an intuitive drag-and-drop interface.
- **Visual Editing:** See your changes in real time as you position elements exactly where you want them.
- **Smart Guides:** Snap elements into alignment with smart guides for precise layouts.
- **No Coding Required:** Create complex picture element layouts without editing YAML manually.

## Usage

1. Open the editor in your browser.
2. Input the YAML file of your picture elements card when prompted.
3. If you use custom pictures with relative paths, enter your Home Assistant domain when prompted to ensure correct image loading.
4. Add, move, and resize elements as needed.
5. Export the generated configuration for use in your Home Assistant dashboard.

## About

This tool is designed to make it easy to visually design and arrange elements for the Home Assistant picture elements card, saving time and reducing errors compared to manual YAML editing.

## Running as a Standalone Container

You can easily run the editor as a standalone container using Docker Compose:

1. **Create a `docker-compose.yml` file** in this directory with the following content:

   ```yaml
   version: '3.8'
   services:
     ha-picture-element-editor:
       image: ghcr.io/stancuflorin/ha-picture-element-editor:latest
       container_name: ha-picture-element-editor
       ports:
         - "8080:80"
       restart: unless-stopped
   ```

2. **Start the editor:**
   ```sh
   docker compose up -d
   ```
   This command will download the image (if needed) and start the service in the background.

3. **Open the editor in your browser:**
   Go to [http://localhost:8080](http://localhost:8080) to access the visual editor.

