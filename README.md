# Docs, No Thanks

Google Classroom attachments, downloaded in one click. No ceremonial trip through Docs required.

## Install

[Build](#build) the unpacked directory:

```sh
npm run build
```

Then install the extension using the following steps:

1. Start Chrome.
2. Open the Extension Management page by navigating to `chrome://extensions`.
3. Enable Developer Mode by clicking the toggle switch next to **Developer mode**.
4. Click the **Load unpacked** button and select the `dist` directory.

## Development

### Build

Install dependencies by:

```sh
npm install
```

Then you can build an unpacked directory by:

```sh
npm run build
```

### Testing

You can execute type checking by:

```sh
npm run typecheck
```

## Permissions

This extension requests only the minimum permissions required to function:

- `storage`: Saves your download mode preference locally.
- Host access (`classroom.google.com`, `drive.google.com`): Adds download buttons to Classroom cards and the embedded Drive viewer.

No user data is collected or transmitted to any external servers.

## License

[CC-BY-NC-4.0](./LICENSE)

## Disclaimer

This is not an officially supported Google product.
