/**
 * Side-effect import: loads xterm.js CSS.
 * Import this file in any component that renders a Terminal.
 *
 * Note: xterm CSS is bundled via the node_modules path.
 * The actual styling is applied by xterm.js internally when
 * Terminal.open() is called — this ensures the CSS is available.
 */
import '@xterm/xterm/css/xterm.css';
