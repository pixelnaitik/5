/**
 * Generates an elegant, high-fidelity default sharing template background for reports.
 * Drawn entirely via HTML5 Canvas to produce a crisp, high-resolution A4-proportioned image.
 * This ensures that a gorgeous, professional default layout is available on all devices out-of-the-box.
 */
export function generateDefaultTemplateImage(labName: string = "Healthcare OS Lab"): string {
  // Use high-resolution coordinates for sharp text and lines on A4 paper printing.
  const width = 1200;
  const height = 1697; // Ratio 1 : 1.414 (standard ISO A4)
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }

  // 1. Solid Pure White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Elegant Modern Header Band (Deep Indigo / Executive Slate)
  // Deep Blue Gradient for the top header accent bar
  const topBarHeight = 45;
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#0b3c5d'); // Deep navy
  gradient.addColorStop(0.5, '#125482'); // Royal navy
  gradient.addColorStop(1, '#0b3c5d'); // Deep navy
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, topBarHeight);

  // Slim Golden/Teal divider line below the top bar for a premium look
  ctx.fillStyle = '#00d4b2'; // Bright clinical teal accent
  ctx.fillRect(0, topBarHeight, width, 5);

  // 3. Subtle Hexagonal Network Pattern in Top Corners (Decoration)
  ctx.strokeStyle = 'rgba(0, 212, 178, 0.15)';
  ctx.lineWidth = 1.5;
  
  const drawHexNode = (x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = x + r * Math.cos(angle);
      const hy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  };

  // Draw hex grid on top right corner
  drawHexNode(1100, 80, 24);
  drawHexNode(1142, 104, 24);
  drawHexNode(1058, 104, 24);
  drawHexNode(1100, 128, 24);
  
  // Draw small connecting lines
  ctx.beginPath();
  ctx.moveTo(1100, 80); ctx.lineTo(1100, 128);
  ctx.moveTo(1058, 104); ctx.lineTo(1142, 104);
  ctx.stroke();

  // 4. Double-lined Outer Frame Border (Sophisticated styling)
  ctx.strokeStyle = 'rgba(11, 60, 93, 0.08)';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 65, width - 48, height - 130);
  
  ctx.strokeStyle = 'rgba(11, 60, 93, 0.03)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(32, 73, width - 64, height - 146);

  // 5. Watermark - Elegant DNA Helix & Medical Shield Cross in the center
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Concentric circle rings for the watermark
  ctx.strokeStyle = 'rgba(11, 60, 93, 0.02)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(11, 60, 93, 0.012)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(11, 60, 93, 0.008)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.stroke();

  // Draw Medical Cross inside shield
  ctx.fillStyle = 'rgba(11, 60, 93, 0.015)';
  ctx.strokeStyle = 'rgba(11, 60, 93, 0.025)';
  ctx.lineWidth = 3.5;
  
  // Shield shape path
  ctx.beginPath();
  ctx.moveTo(0, -90);
  ctx.quadraticCurveTo(65, -90, 75, -20);
  ctx.quadraticCurveTo(75, 45, 0, 100);
  ctx.quadraticCurveTo(-75, 45, -75, -20);
  ctx.quadraticCurveTo(-65, -90, 0, -90);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Plus cross inside shield
  ctx.fillStyle = 'rgba(11, 60, 93, 0.022)';
  ctx.fillRect(-15, -45, 30, 90);
  ctx.fillRect(-45, -15, 90, 30);
  
  ctx.restore();

  // 6. Premium Decorative Side Accents
  // Left side color-ribbon accent (Medical-themed subtle vertical bar)
  const accentGradient = ctx.createLinearGradient(0, 150, 0, 1500);
  accentGradient.addColorStop(0, 'rgba(11, 60, 93, 0.04)');
  accentGradient.addColorStop(0.5, 'rgba(0, 212, 178, 0.12)');
  accentGradient.addColorStop(1, 'rgba(11, 60, 93, 0.04)');
  
  ctx.fillStyle = accentGradient;
  ctx.fillRect(8, 150, 8, height - 300);

  // Right side color-ribbon accent
  ctx.fillRect(width - 16, 150, 8, height - 300);

  // 7. Footer Base Design (Professional & Accredited)
  const footerStart = height - 70;
  
  // Light green / teal accent line above footer
  ctx.fillStyle = '#00d4b2';
  ctx.fillRect(0, footerStart, width, 4);

  // Dark slate bottom ribbon for footer metadata
  ctx.fillStyle = '#0b3c5d';
  ctx.fillRect(0, footerStart + 4, width, 66);

  // Footer Branding Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Inter", "Helvetica", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HEALTHCARE OS DIAGNOSTICS SYSTEMS', 40, footerStart + 36);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 11px "JetBrains Mono", "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('NABL ACCREDITED LAB • ISO 9001:2015 CERTIFIED REPORT', width - 40, footerStart + 30);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'medium italic 10px "Inter", sans-serif';
  ctx.fillText('This document is electronically verified. No physical signature required.', width - 40, footerStart + 46);

  return canvas.toDataURL('image/png');
}
