import './style.css';
import { App } from './app';

new App(document.getElementById('app')!);

// ダブルタップ拡大・ピンチなどの誤操作を抑える(iOS Safari)
document.addEventListener('gesturestart', (e) => e.preventDefault());
