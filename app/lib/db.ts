import fs from 'fs';
import path from 'path';

export function getOrdersFilePath(): string {
  if (process.env.VERCEL) {
    const tmpFile = path.join('/tmp', 'orders.json');
    if (!fs.existsSync(tmpFile)) {
      const seedFile = path.join(process.cwd(), 'data', 'orders.json');
      if (fs.existsSync(seedFile)) {
        try {
          fs.copyFileSync(seedFile, tmpFile);
        } catch {
          fs.writeFileSync(tmpFile, '[]', 'utf8');
        }
      } else {
        fs.writeFileSync(tmpFile, '[]', 'utf8');
      }
    }
    return tmpFile;
  }
  return path.join(process.cwd(), 'data', 'orders.json');
}

export function getReviewsFilePath(): string {
  if (process.env.VERCEL) {
    const tmpFile = path.join('/tmp', 'reviews.json');
    if (!fs.existsSync(tmpFile)) {
      const seedFile = path.join(process.cwd(), 'data', 'reviews.json');
      if (fs.existsSync(seedFile)) {
        try {
          fs.copyFileSync(seedFile, tmpFile);
        } catch {
          fs.writeFileSync(tmpFile, '[]', 'utf8');
        }
      } else {
        fs.writeFileSync(tmpFile, '[]', 'utf8');
      }
    }
    return tmpFile;
  }
  return path.join(process.cwd(), 'data', 'reviews.json');
}

export function readOrders(): any[] {
  try {
    const file = getOrdersFilePath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading orders:', err);
  }
  return [];
}

export function writeOrders(orders: any[]): void {
  try {
    const file = getOrdersFilePath();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing orders:', err);
  }
}

export function readReviews(): any[] {
  try {
    const file = getReviewsFilePath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading reviews:', err);
  }
  return [];
}

export function writeReviews(reviews: any[]): void {
  try {
    const file = getReviewsFilePath();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing reviews:', err);
  }
}
