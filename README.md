# MimTV - Advanced Stream Player

MimTV is an advanced IPTV streaming solution that offers a user-friendly interface for watching live TV channels. This project demonstrates the implementation of a dynamic playlist parser and video player using modern web technologies.

## Features

- Dynamic M3U playlist parsing
- HLS video playback with fallback options
- Responsive design for various screen sizes
- Channel search functionality with debouncing
- Lazy loading of channel logos
- Improved accessibility with ARIA attributes and keyboard navigation
- Error handling and user feedback system
- Cross-browser compatibility

## Technologies Used

- HTML5
- CSS3 with CSS Variables
- JavaScript (ES6+)
- [Plyr](https://github.com/sampotts/plyr) for enhanced video controls
- [hls.js](https://github.com/video-dev/hls.js/) for HLS video streaming

## Setup and Usage

1. Clone the repository:
   ```
   git clone https://github.com/your-username/mimtv.git
   cd mimtv
   ```

2. Open `index.html` in a modern web browser.

3. For development purposes, you may need to use a CORS proxy. The current implementation uses the CORS Anywhere demo server. For production, replace this with your own backend proxy solution.

## Customization

- Update the `playlistUrl` variable in the JavaScript code to point to your M3U playlist.
- Modify the CSS variables in the `:root` selector to change the color scheme.
- Add or remove video player controls by modifying the Plyr initialization options.

## Production Considerations

Before deploying to production:

1. Replace the CORS Anywhere proxy with a dedicated backend solution.
2. Implement proper error tracking and logging.
3. Add analytics if needed.
4. Consider implementing a service worker for offline support and caching.
5. Add appropriate security headers and Content Security Policy (CSP).
6. Optimize assets and implement CDN for improved performance.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

- Rekt Developers for the initial concept and development
- The open-source community for the fantastic libraries and tools used in this project
