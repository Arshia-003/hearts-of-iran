// ============================================================
// JSONBin CONFIG
// ============================================================
const BIN_ID = '6aa1c487ffd5d16053f334a8';
const MASTER_KEY = '$2a$10$Aeo5..C6OPC7HvhrJihfQ.XJWcdz738W7cC3ZoIcPWMyGe9lJoaam';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ============================================================
// CONSTANTS
// ============================================================
const OWNER_USERNAME = 'ArshiaT';

// ============================================================
// STATE (مشترک بین صفحات)
// ============================================================
let currentUser = null;
let isLoginMode = false;
let chatInterval = null;
let userInterval = null;
let checkInterval = null;

// ============================================================
// MAPS (پرچم و پس‌زمینه کشورها)
// ============================================================
const flagMap = {
    'آلمان': 'germany-flag.png',
    'بریتانیا': 'uk-flag.png',
    'آمریکا': 'usa-flag.png',
    'ژاپن': 'japan-flag.png',
    'شوروی': 'soviet-flag.png',
    'ایتالیا': 'italy-flag.png',
    'فرانسه': 'france-flag.png'
};

const bgMap = {
    'آلمان': 'germany-bg.jpg',
    'بریتانیا': 'uk-bg.jpg',
    'آمریکا': 'usa-bg.jpg',
    'ژاپن': 'japan-bg.jpg',
    'شوروی': 'soviet-bg.jpg',
    'ایتالیا': 'italy-bg.jpg',
    'فرانسه': 'france-bg.jpg'
};

// ============================================================
// DOM HELPER
// ============================================================
const $ = id => document.getElementById(id);
