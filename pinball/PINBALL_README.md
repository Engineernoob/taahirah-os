# 3D Pinball: Space Cadet - Web Edition

A fully functional web-based recreation of the classic 3D Pinball: Space Cadet game, built with modern web technologies and optimized for portfolio websites.

## 🎮 Features

### Core Gameplay
- **Realistic Ball Physics**: Gravity, friction, and collision detection
- **Interactive Flippers**: Left and right flipper controls with realistic movement
- **Bumpers**: Multiple bumpers with scoring and visual feedback
- **Ramps**: Launch ramps for bonus points and ball trajectory changes
- **Targets**: Hit targets to trigger special modes
- **Multiball Mode**: Unlock multiball by hitting specific bumpers or targets
- **Progressive Difficulty**: Increasing challenge as you advance

### Visual Effects
- **Particle Animations**: Dynamic particle effects for collisions and impacts
- **Score Popups**: Floating score indicators for immediate feedback
- **Ball Trails**: Visual trails showing ball movement paths
- **Glowing Effects**: Neon-style glowing elements for retro aesthetic
- **Screen Flash**: Visual feedback for major scoring events

### Audio System
- **Synthesized Sound Effects**: Web Audio API generated sounds
  - Bumper hits
  - Flipper activation
  - Ball launch
  - Target hits
  - Multiball activation
  - Game over

### Controls
- **Desktop**:
  - Left/Right Arrow Keys or A/D for flippers
  - Spacebar to launch ball and pause game
- **Mobile**:
  - Touch left/right sides of screen for flippers
  - Tap launch button to start game

### Responsive Design
- **Desktop**: Full-featured experience with optimal layout
- **Tablet**: Adapted controls and layout for touch devices
- **Mobile**: Optimized for small screens with touch controls

## 🛠️ Technical Implementation

### Architecture
- **Modular Design**: Clean separation of concerns
- **Object-Oriented**: Class-based game engine architecture
- **Canvas Rendering**: Hardware-accelerated 2D graphics
- **Event-Driven**: Responsive input handling system

### Physics Engine
- **Gravity Simulation**: Realistic gravitational effects
- **Collision Detection**: Circle-rectangle and circle-circle collision
- **Force Application**: Momentum transfer for realistic ball movement
- **Damping Systems**: Energy loss simulation for realistic physics

### Game State Management
- **Score Tracking**: Persistent high score with localStorage
- **Ball Management**: Multiple ball support for multiball mode
- **Game States**: Loading, playing, paused, and game over states
- **Combo System**: Score multipliers for consecutive hits

## 📁 File Structure

```
pinball-game/
├── pinball.html          # Main game HTML structure
├── pinball.css           # Game-specific styles and animations
├── pinball.js            # Complete game engine and logic
├── style.css             # Base Windows 95 theme styles
├── script.js             # Windows 95 desktop functionality
├── fonts/                # Custom Windows 95 fonts
├── icons/                # Game and UI icons
└── sounds/               # Audio assets (if available)
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser with Web Audio API support
- Local web server (for optimal performance)

### Installation
1. Clone or download the project files
2. Serve the files using a local web server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Using Node.js (if you have http-server installed)
   npx http-server

   # Using PHP
   php -S localhost:8000
   ```
3. Open your browser and navigate to `http://localhost:8000/pinball.html`

### Integration with Portfolio
The game is designed to integrate seamlessly into portfolio websites:

1. **Direct Link**: Link directly to `pinball.html`
2. **Embedded**: Include the game in an iframe within your portfolio
3. **Responsive**: Automatically adapts to different screen sizes

## 🎯 Game Mechanics

### Scoring System
- **Bumpers**: 100-200 points each
- **Targets**: 300 points each
- **Ramps**: 500 points each
- **Flippers**: 10 points per hit
- **Multiball**: 2x score multiplier

### Special Modes
- **Multiball**: Triggered by hitting high-value bumpers or all targets
- **Combo Multiplier**: Consecutive hits increase score multiplier
- **Ball Management**: Up to 3 balls per game

### Physics Parameters
- **Gravity**: 0.3 units per frame
- **Friction**: 0.98 (2% energy loss per frame)
- **Bounce Damping**: 0.8 (20% energy loss on collision)
- **Flipper Force**: 0.5 units of acceleration

## 🎨 Customization

### Visual Theme
The game uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #00ff88;
  --secondary-color: #ff6b35;
  --background-gradient: linear-gradient(135deg, #000428 0%, #004e92 100%);
  --accent-glow: rgba(0, 255, 136, 0.5);
}
```

### Game Balance
Adjust game difficulty by modifying physics constants in `pinball.js`:

```javascript
// Easy mode
this.gravity = 0.2;
this.friction = 0.99;

// Hard mode
this.gravity = 0.4;
this.friction = 0.97;
```

## 🔧 Browser Compatibility

### Supported Browsers
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Required Features
- HTML5 Canvas
- Web Audio API
- ES6+ JavaScript features
- CSS Grid and Flexbox
- CSS Custom Properties

## 📱 Mobile Optimization

### Touch Controls
- **Responsive Touch Areas**: Large touch targets for flippers
- **Gesture Recognition**: Swipe and tap gesture support
- **Orientation Handling**: Landscape and portrait mode support

### Performance
- **Optimized Rendering**: Efficient canvas updates
- **Reduced Particle Effects**: Simplified effects on mobile
- **Adaptive Quality**: Automatic quality adjustment based on device capabilities

## 🐛 Known Issues and Limitations

### Performance
- High particle counts may impact performance on older devices
- Complex collision detection in multiball mode

### Audio
- Web Audio API requires user interaction to start
- Some browsers may block audio without HTTPS

### Physics
- Simplified 2D physics (not true 3D simulation)
- Some edge cases in collision detection

## 🔮 Future Enhancements

### Planned Features
- [ ] Additional table layouts
- [ ] More sound effects and music
- [ ] Online leaderboards
- [ ] Custom table editor
- [ ] Advanced physics options
- [ ] Tournament mode

### Technical Improvements
- [ ] WebGL rendering for better performance
- [ ] Physics engine optimization
- [ ] Progressive Web App (PWA) features
- [ ] Offline capability

## 📄 License

This project is created for educational and portfolio purposes. The original 3D Pinball: Space Cadet is a trademark of Microsoft Corporation.

## 🤝 Contributing

Feel free to fork this project and submit improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions, issues, or suggestions:
- Create an issue in the repository
- Check the browser console for debugging information
- Ensure your browser supports all required web APIs

---

**Built with ❤️ using vanilla HTML, CSS, and JavaScript**

*Experience the nostalgia of classic pinball with modern web technology!*