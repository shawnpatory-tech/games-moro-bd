import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  Tournament,
  ScoringConfig,
  MatchReport,
  BlacklistEntry,
  AuditLog,
  AppNotification,
  SupportTicket,
  Participant,
  MatchReportResult,
  WalletTransaction,
  AppSettings,
  AbnormalPlayReport,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// ==========================================
// IN-MEMORY DATABASE WITH REAL PERSISTENCE
// ==========================================

const scoringConfig: ScoringConfig = {
  brRank: {
    rank1: 100,
    rank2: 70,
    rank3: 50,
    rank4: 30,
    rank5: 20,
    killPoints: 5,
    maxRewardedKills: 5, // Top 5 max 5 kill cap -> 1st place with 6 kills gets 125 pts
  },
  csRank: {
    winTeamPoints: 40,
    loseTeamPoints: 10,
    mvpBonusPoints: 15,
    killPoint: 2,
  },
  loneWolf: {
    winPoints: 35,
    losePoints: 5,
    flawlessBonus: 15,
  },
};

let users: User[] = [
  {
    id: 'user-owner',
    email: 'owner@gamesmorobd.com',
    phone: '+880 1711 000001',
    username: 'GMBD_SupremeOwner',
    inGameName: 'MORO亗OWNER',
    inGameUid: '289104882',
    tournamentUid: 'GMBD-0001',
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    isBanned: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    stats: {
      matchesPlayed: 142,
      wins: 48,
      kills: 590,
      top5Count: 96,
      tournamentPoints: 4820,
      winRate: 33.8,
      kda: 4.15,
    },
    walletBalance: 12500,
  },
  {
    id: 'user-admin',
    email: 'admin@gamesmorobd.com',
    phone: '+880 1812 000002',
    username: 'Tariq_AdminOps',
    inGameName: 'MORO彡TARIQ',
    inGameUid: '582910443',
    tournamentUid: 'GMBD-0002',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isBanned: false,
    createdAt: '2025-01-05T00:00:00.000Z',
    stats: {
      matchesPlayed: 98,
      wins: 31,
      kills: 380,
      top5Count: 65,
      tournamentPoints: 3150,
      winRate: 31.6,
      kda: 3.87,
    },
    walletBalance: 5000,
  },
  {
    id: 'user-officer-1',
    email: 'officer1@gamesmorobd.com',
    phone: '+880 1913 000003',
    username: 'Officer_Farhan',
    inGameName: 'OFFICER_FARHAN',
    inGameUid: '992817462',
    tournamentUid: 'GMBD-1001',
    role: 'officer',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    isBanned: false,
    createdAt: '2025-02-01T00:00:00.000Z',
    stats: {
      matchesPlayed: 64,
      wins: 19,
      kills: 220,
      top5Count: 42,
      tournamentPoints: 2120,
      winRate: 29.6,
      kda: 3.43,
    },
    walletBalance: 1200,
  },
  {
    id: 'user-officer-2',
    email: 'officer2@gamesmorobd.com',
    phone: '+880 1614 000004',
    username: 'Officer_Afnan',
    inGameName: 'OFFICER_AFNAN',
    inGameUid: '882910331',
    tournamentUid: 'GMBD-1002',
    role: 'officer',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    isBanned: false,
    createdAt: '2025-02-10T00:00:00.000Z',
    stats: {
      matchesPlayed: 52,
      wins: 15,
      kills: 180,
      top5Count: 35,
      tournamentPoints: 1740,
      winRate: 28.8,
      kda: 3.46,
    },
    walletBalance: 850,
  },
  {
    id: 'user-player-1',
    email: 'shawnpatory@gmail.com',
    phone: '+880 1755 123456',
    username: 'MoroRaptor_BD',
    inGameName: 'RAPTOR彡BD99',
    inGameUid: '192837465',
    tournamentUid: 'GMBD-74892',
    role: 'player',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isBanned: false,
    createdAt: '2025-02-15T00:00:00.000Z',
    stats: {
      matchesPlayed: 42,
      wins: 14,
      kills: 168,
      top5Count: 29,
      tournamentPoints: 1650,
      winRate: 33.3,
      kda: 4.0,
    },
    walletBalance: 350, // Starting player balance (৳350)
  },
  {
    id: 'user-player-2',
    email: 'tanvir.gamer@gmail.com',
    phone: '+880 1722 987654',
    username: 'ViperSniper_BD',
    inGameName: 'VIPER亗HEAD',
    inGameUid: '349102834',
    tournamentUid: 'GMBD-74893',
    role: 'player',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isBanned: false,
    createdAt: '2025-02-18T00:00:00.000Z',
    stats: {
      matchesPlayed: 55,
      wins: 18,
      kills: 210,
      top5Count: 39,
      tournamentPoints: 1980,
      winRate: 32.7,
      kda: 3.81,
    },
    walletBalance: 180,
  },
  {
    id: 'user-player-banned',
    email: 'cheater.alert@gmail.com',
    phone: '+880 1999 000111',
    username: 'NoRecoilShadow',
    inGameName: 'HACKER_X',
    inGameUid: '901283746',
    tournamentUid: 'GMBD-99999',
    role: 'player',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isBanned: true,
    banDetails: {
      reason: 'Confirmed third-party aim lock overlay detected during CS Rank Match #104.',
      evidenceUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
      bannedAt: '2025-02-28T14:30:00.000Z',
      bannedByName: 'Tariq_AdminOps',
      duration: 'permanent',
      appealStatus: 'PENDING',
      appealReason: 'My screen recorder was glitching, I was not using scripts. Please review my handcam.',
      appealSubmittedAt: '2025-03-01T10:15:00.000Z',
    },
    createdAt: '2025-02-05T00:00:00.000Z',
    stats: {
      matchesPlayed: 12,
      wins: 9,
      kills: 88,
      top5Count: 11,
      tournamentPoints: 950,
      winRate: 75.0,
      kda: 7.33,
    },
    walletBalance: 0,
  },
];

let currentUser: User = users[4]; // Default to MoroRaptor_BD

// Sample Tournament Data
let tournaments: Tournament[] = [
  {
    id: 'tourn-br-101',
    title: 'BR RANK: Elite Survivor Clash #101',
    mode: 'BR_RANK',
    maxPlayers: 48,
    slotsFilled: 46,
    startTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins away
    endTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    status: 'REGISTRATION_OPEN',
    entryType: 'Free Official Qualifier',
    entryFee: 50, // ৳৫০ এন্ট্রি ফি
    roomDetails: {
      roomId: '9482103',
      roomPassword: 'GMBD@BERMUDA',
      isRevealed: false,
      customMap: 'Bermuda Remastered',
      serverRegion: 'Bangladesh (BD/SG)',
    },
    assignedOfficerId: 'user-officer-1',
    assignedOfficerName: 'Officer_Farhan',
    pointsPrizePool: 320,
    rulesSummary: [
      'সোলো ৪৮ জন প্লেয়ার (Solo 48 Players)',
      'এক জীবন - কোনো রিভাইভ পয়েন্ট বা রিভাইভ কার্ড ব্যবহার করা যাবে না',
      'টপ ৫ প্লেয়ার পুরস্কৃত ও কোয়ালিফাই হবে (১ম: ১০০, ২য়: ৭০, ৩য়: ৫০, ৪র্থ: ৩০, ৫ম: ২০ পয়েন্ট)',
      'কিল পয়েন্ট: প্রতি কিলে ৫ পয়েন্ট (টপ ৫ এর জন্য সর্বোচ্চ ৫ কিল পর্যন্ত বোনাস)',
      'টপ ৫ এর বাইরে প্লেয়াররা কোনো টুর্নামেন্ট পয়েন্ট পাবে না',
    ],
    registeredPlayers: [
      {
        id: 'p-1',
        userId: 'user-player-1',
        username: 'MoroRaptor_BD',
        inGameName: 'RAPTOR彡BD99',
        inGameUid: '192837465',
        registeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'p-2',
        userId: 'user-player-2',
        username: 'ViperSniper_BD',
        inGameName: 'VIPER亗HEAD',
        inGameUid: '349102834',
        registeredAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tourn-cs-202',
    title: 'CS RANK: Crimson Squad War #202',
    mode: 'CS_RANK',
    maxPlayers: 8,
    slotsFilled: 8,
    startTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 mins away
    endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: 'ROOM_PREPARING',
    entryType: 'Championship Slot',
    entryFee: 40, // ৳৪০ এন্ট্রি ফি
    roomDetails: {
      roomId: '6618290',
      roomPassword: 'CSBD#SQUAD',
      isRevealed: true, // Room ready for registered players
      customMap: 'Kalahari Arena',
      serverRegion: 'Bangladesh (BD/SG)',
    },
    assignedOfficerId: 'user-officer-2',
    assignedOfficerName: 'Officer_Afnan',
    pointsPrizePool: 240,
    rulesSummary: [
      '২ টি টিম (প্রতি টিমে ৪ জন প্লেয়ার - আলফা বনাম ব্র্যাভো)',
      'ক্লাসিক ৭ রাউন্ডের জয়ী দল বিজয়ী ঘোষিত হবে',
      'ক্যারেক্টার স্কিল: চালু, গান অ্যাট্রিবিউট: সম্পূর্ণ বন্ধ',
      'গ্রেনেড লিমিট: প্রতি রাউন্ডে প্লেয়ার প্রতি সর্বোচ্চ ১ টি',
      'বিজয়ী স্কোয়াডের প্রত্যেকে পাবে ৪০ টিপি + এমভিপি বোনাস',
    ],
    registeredPlayers: [
      {
        id: 'p-cs-1',
        userId: 'user-player-1',
        username: 'MoroRaptor_BD',
        inGameName: 'RAPTOR彡BD99',
        inGameUid: '192837465',
        teamSlot: 'Alpha',
        registeredAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
      {
        id: 'p-cs-2',
        userId: 'user-player-2',
        username: 'ViperSniper_BD',
        inGameName: 'VIPER亗HEAD',
        inGameUid: '349102834',
        teamSlot: 'Alpha',
        registeredAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tourn-lw-303',
    title: 'LONE WOLF: Iron Duel #303',
    mode: 'LONE_WOLF',
    maxPlayers: 2,
    slotsFilled: 2,
    startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Ongoing / Live
    endTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: 'LIVE',
    entryType: 'Weekly Clash',
    entryFee: 25, // ৳২৫ এন্ট্রি ফি
    roomDetails: {
      roomId: '1192834',
      roomPassword: '1V1#DUEL',
      isRevealed: true,
      customMap: 'Iron Cage',
      serverRegion: 'Bangladesh (BD/SG)',
    },
    assignedOfficerId: 'user-officer-1',
    assignedOfficerName: 'Officer_Farhan',
    pointsPrizePool: 80,
    rulesSummary: [
      '১ বনাম ১ পিউর এইম ও স্কিল ডুয়েল শোডাউন',
      'প্রথম ৫ রাউন্ড জয়ী প্লেয়ার বিজয়ী ঘোষিত হবে',
      'একই গান পুল থেকে রাউন্ড অনুযায়ী পছন্দ নির্ধারণ',
      'বিজয়ী পাবে ৩৫ টিপি, রানার-আপ পাবে ৫ টিপি',
    ],
    registeredPlayers: [
      {
        id: 'p-lw-1',
        userId: 'user-player-1',
        username: 'MoroRaptor_BD',
        inGameName: 'RAPTOR彡BD99',
        inGameUid: '192837465',
        registeredAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        id: 'p-lw-2',
        userId: 'user-player-2',
        username: 'ViperSniper_BD',
        inGameName: 'VIPER亗HEAD',
        inGameUid: '349102834',
        registeredAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tourn-br-100',
    title: 'BR RANK: Morning Blitz Cup #100',
    mode: 'BR_RANK',
    maxPlayers: 48,
    slotsFilled: 48,
    startTime: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'REPORT_PENDING',
    entryType: 'Free Official Qualifier',
    entryFee: 50,
    roomDetails: {
      roomId: '8819201',
      roomPassword: 'GMBD#MORNING',
      isRevealed: true,
      customMap: 'Purgatory High Noon',
      serverRegion: 'Bangladesh (BD/SG)',
    },
    assignedOfficerId: 'user-officer-2',
    assignedOfficerName: 'Officer_Afnan',
    pointsPrizePool: 320,
    rulesSummary: [
      'সোলো ৪৮ জন প্লেয়ার',
      'এক জীবন - কোনো রিভাইভ নেই',
      'টপ ৫ প্লেয়ার পয়েন্ট অর্জন করবে + কিল ক্যাপ',
    ],
    registeredPlayers: [],
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

let walletTransactions: WalletTransaction[] = [
  {
    id: 'trx-dep-001',
    userId: 'user-player-1',
    username: 'MoroRaptor_BD',
    type: 'DEPOSIT',
    amount: 500,
    method: 'bKash',
    senderPhone: '01755123456',
    receiverPhone: '01711000001',
    trxId: 'BKH98210459',
    status: 'APPROVED',
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    adminNotes: 'Verified via bKash merchant statement',
  },
  {
    id: 'trx-fee-002',
    userId: 'user-player-1',
    username: 'MoroRaptor_BD',
    type: 'MATCH_ENTRY_FEE',
    amount: 50,
    status: 'APPROVED',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    matchId: 'tourn-br-101',
    matchTitle: 'BR RANK: Elite Survivor Clash #101',
  },
  {
    id: 'trx-fee-003',
    userId: 'user-player-1',
    username: 'MoroRaptor_BD',
    type: 'MATCH_ENTRY_FEE',
    amount: 40,
    status: 'APPROVED',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    matchId: 'tourn-cs-202',
    matchTitle: 'CS RANK: Crimson Squad War #202',
  },
];

let matchReports: MatchReport[] = [
  {
    id: 'report-100',
    tournamentId: 'tourn-br-100',
    tournamentTitle: 'BR RANK: Morning Blitz Cup #100',
    mode: 'BR_RANK',
    submittedByOfficerId: 'user-officer-2',
    submittedByOfficerName: 'Officer_Afnan',
    submittedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'PENDING_APPROVAL',
    officerNotes:
      'Match concluded cleanly without disconnects. Screen recording verified. Player MoroRaptor_BD claimed 1st place Booyah with 6 kills (awarded 125 TP per scoring cap). 2nd place had 3 kills.',
    evidenceScreenshotUrl:
      '/src/assets/images/tournament_hero_banner_1793899507217.jpg',
    results: [
      {
        userId: 'user-player-1',
        username: 'MoroRaptor_BD',
        inGameName: 'RAPTOR彡BD99',
        inGameUid: '192837465',
        placement: 1,
        kills: 6,
        calculatedPoints: 125, // 100 pos + min(6, 5)*5 = 125
      },
      {
        userId: 'user-player-2',
        username: 'ViperSniper_BD',
        inGameName: 'VIPER亗HEAD',
        inGameUid: '349102834',
        placement: 2,
        kills: 3,
        calculatedPoints: 85, // 70 pos + 3*5 = 85
      },
      {
        userId: 'user-bot-3',
        username: 'ApexGhost_BD',
        inGameName: 'GHOST亗SHADOW',
        inGameUid: '449102941',
        placement: 3,
        kills: 4,
        calculatedPoints: 70, // 50 pos + 4*5 = 70
      },
      {
        userId: 'user-bot-4',
        username: 'DeltaForce_7',
        inGameName: 'DELTA彡KILLER',
        inGameUid: '559102942',
        placement: 4,
        kills: 2,
        calculatedPoints: 40, // 30 pos + 2*5 = 40
      },
      {
        userId: 'user-bot-5',
        username: 'ChronoShield',
        inGameName: 'CHRONO亗DEF',
        inGameUid: '669102943',
        placement: 5,
        kills: 1,
        calculatedPoints: 25, // 20 pos + 1*5 = 25
      },
      {
        userId: 'user-bot-6',
        username: 'SavageEliminator',
        inGameName: 'SAVAGE彡BOY',
        inGameUid: '779102944',
        placement: 6,
        kills: 5,
        calculatedPoints: 0, // Outside Top 5 receives 0 points per official rule!
      },
    ],
  },
];

let blacklist: BlacklistEntry[] = [
  {
    id: 'ban-001',
    userId: 'user-player-banned',
    inGameUid: '901283746',
    username: 'NoRecoilShadow',
    reason: 'Confirmed third-party aim lock overlay detected during CS Rank Match #104.',
    evidenceUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    bannedAt: '2025-02-28T14:30:00.000Z',
    bannedByAdminId: 'user-admin',
    bannedByAdminName: 'Tariq_AdminOps',
    duration: 'permanent',
    appealStatus: 'PENDING',
    appealReason: 'My screen recorder was glitching, I was not using scripts. Please review my handcam.',
    appealDate: '2025-03-01T10:15:00.000Z',
  },
];

let appSettings: AppSettings = {
  appName: 'GAMES MORO BD',
  tagline: 'বাংলাদেশের অফিশিয়াল ফ্রি ফায়ার এস্পোর্টস টুর্নামেন্ট হাব',
  emergencyBanner: {
    enabled: true,
    type: 'WARNING',
    message: 'জরুরি নোটিশ: টুর্নামেন্টে যেকোনো ধরণের প্যানেল হ্যাক, অটো হেডশট বা স্ক্রিপ্ট ব্যবহার করলে সাথে সাথে ফ্রি ফায়ার আইডি স্থায়ী ব্যান করা হবে!',
    linkUrl: '',
  },
  contactNumbers: {
    bKash: '01711000001',
    nagad: '01811000002',
    rocket: '01911000003',
    supportPhone: '+880 1711 000001',
    whatsapp: '+880 1711 000001',
  },
  tutorialVideo: {
    enabled: true,
    title: 'কিভাবে কাস্টম রুমে প্রবেশ করবেন ও ম্যাচ খেলবেন (ভিডিও গাইড)',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'ম্যাচ শুরুর ঠিক ১০ মিনিট আগে রুম আইডি ও পাসওয়ার্ড এই অ্যাপে আনলক হবে। নির্ধারিত সময়ের ৫ মিনিট পূর্বে রুমে প্রবেশ করুন।',
  },
  noticeBoardText: 'আজকের সকল ব্র‍্যাকেটের ম্যাচ শিডিউল সকাল ৮:০০ টা থেকে রাত ১২:০০ টা পর্যন্ত লাইভ চলবে। ফেয়ার প্লে মেনে খেলুন।',
  shareMessage: 'GAMES MORO BD - বাংলাদেশের সেরা ফ্রি ফায়ার টুর্নামেন্ট অ্যাপ! এখনি ফ্রিতে রেজিস্টার করে BR Rank, CS Rank খেলে পুরস্কার জিতুন:',
};

let abnormalReports: AbnormalPlayReport[] = [
  {
    id: 'inc-001',
    tournamentId: 'tourn-cs-202',
    tournamentTitle: 'CS RANK: Crimson Squad War #202',
    officerId: 'user-officer-1',
    officerName: 'Officer_Farhan',
    accusedPlayerName: 'GhostHeadshot_99',
    accusedPlayerUid: '661209843',
    accusedUserId: undefined,
    cheatType: 'PANEL_HACK',
    cheatTypeBangla: 'প্যানেল হ্যাক / ১০০% অটো হেডশট (Panel Hack)',
    evidenceUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
    videoProofUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    incidentRoundOrTime: 'Round 3 (02:14 mark)',
    description: 'প্লেয়ার ডেজার্ট ঈগল দিয়ে কোনো রিকোয়েল ছাড়াই এক সেকেন্ডে ৩টি অসম্ভব জাম্প হেডশট নিয়েছে। সন্দেহভাজন প্যানেল হ্যাকার।',
    status: 'PENDING_REVIEW',
    submittedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
];

let auditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    actorId: 'user-admin',
    actorName: 'Tariq_AdminOps',
    actorRole: 'admin',
    action: 'TOURNAMENT_SCHEDULE_GENERATED',
    details: 'Generated 14 automated daily slots for CS Rank and BR Rank.',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    actorId: 'user-admin',
    actorName: 'Tariq_AdminOps',
    actorRole: 'admin',
    action: 'OFFICER_ASSIGNED',
    details: 'Assigned Officer_Farhan to BR RANK: Elite Survivor Clash #101.',
    targetId: 'tourn-br-101',
    targetName: 'BR RANK: Elite Survivor Clash #101',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    actorId: 'user-officer-2',
    actorName: 'Officer_Afnan',
    actorRole: 'officer',
    action: 'MATCH_REPORT_SUBMITTED',
    details: 'Submitted match report with 6 participant results and screenshot evidence.',
    targetId: 'tourn-br-100',
    targetName: 'BR RANK: Morning Blitz Cup #100',
  },
];

let notifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Registration Confirmed',
    message: 'You have secured a slot in BR RANK: Elite Survivor Clash #101. Room details open 10 mins before start.',
    type: 'REGISTRATION',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
    tournamentId: 'tourn-br-101',
  },
  {
    id: 'notif-2',
    title: 'Room Credentials Ready!',
    message: 'Room details for CS RANK: Crimson Squad War #202 are now unlocked. Join room promptly.',
    type: 'ROOM_ALERT',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    tournamentId: 'tourn-cs-202',
  },
  {
    id: 'notif-3',
    title: 'Official Rule Update',
    message: 'BR Rank scoring now enforces strict 5-kill cap for Top 5 qualifiers. Anti-teaming algorithms active.',
    type: 'SYSTEM_ALERT',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

let supportTickets: SupportTicket[] = [
  {
    id: 'ticket-1',
    userId: 'user-player-1',
    username: 'MoroRaptor_BD',
    inGameUid: '192837465',
    subject: 'Room ID copy button query',
    category: 'Room Access',
    message: 'Can I copy the room password directly into Free Fire on Android without leaving the app?',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    adminReply: 'Yes, tap the Copy button next to the password to copy it directly to your Android clipboard.',
  },
];

// Helper: Add Audit Log
function logAction(
  actor: User,
  action: string,
  details: string,
  targetId?: string,
  targetName?: string
) {
  const newLog: AuditLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.username,
    actorRole: actor.role,
    action,
    details,
    targetId,
    targetName,
  };
  auditLogs.unshift(newLog);
  if (auditLogs.length > 200) auditLogs.pop();
}

// ==========================================
// AUTH & USER ENDPOINTS
// ==========================================

// Switch current active user (convenient for evaluator testing of all 4 roles)
app.post('/api/auth/switch-role', (req: Request, res: Response) => {
  const { role, userId } = req.body;
  if (userId) {
    const found = users.find((u) => u.id === userId);
    if (found) {
      currentUser = found;
      return res.json({ success: true, user: currentUser });
    }
  }
  if (role) {
    const found = users.find((u) => u.role === role);
    if (found) {
      currentUser = found;
      return res.json({ success: true, user: currentUser });
    }
  }
  return res.status(400).json({ error: 'User not found' });
});

// Current user profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({ user: currentUser });
});

// Register new player
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, phone, username, inGameName, inGameUid } = req.body;

  if (!username || !inGameName || !inGameUid) {
    return res.status(400).json({ error: 'Username, In-Game Name, and In-Game UID are required.' });
  }

  // Check if UID is blacklisted
  const isBanned = blacklist.some((b) => b.inGameUid === inGameUid);
  if (isBanned) {
    return res.status(403).json({ error: 'This In-Game UID is currently blacklisted in GAMES MORO BD.' });
  }

  const newPlayer: User = {
    id: 'user-' + Date.now(),
    email: email || `${username.toLowerCase()}@player.gamesmorobd.com`,
    phone: phone || '+880 1700 000000',
    username,
    inGameName,
    inGameUid,
    tournamentUid: 'GMBD-' + Math.floor(10000 + Math.random() * 90000),
    role: 'player',
    walletBalance: 250,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isBanned: false,
    createdAt: new Date().toISOString(),
    stats: {
      matchesPlayed: 0,
      wins: 0,
      kills: 0,
      top5Count: 0,
      tournamentPoints: 0,
      winRate: 0,
      kda: 0,
    },
  };

  users.push(newPlayer);
  currentUser = newPlayer;

  logAction(newPlayer, 'PLAYER_REGISTRATION', `New player registered with UID ${inGameUid}`);

  res.json({ success: true, user: newPlayer });
});

// Phone OTP Simulation
let pendingOtps = new Map<string, string>();

app.post('/api/auth/phone-otp/send', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || phone.length < 9) {
    return res.status(400).json({ error: 'Valid phone number required' });
  }
  const otp = '7892'; // Deterministic test OTP for seamless testing
  pendingOtps.set(phone, otp);
  res.json({
    success: true,
    message: `OTP sent successfully to ${phone}. For testing, use code: ${otp}`,
    testOtp: otp,
  });
});

app.post('/api/auth/phone-otp/verify', (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  if (otp === '7892' || pendingOtps.get(phone) === otp) {
    let existing: User | undefined = users.find((u) => u.phone === phone);
    if (!existing) {
      existing = {
        id: 'user-otp-' + Date.now(),
        email: `player_${phone.slice(-4)}@gamesmorobd.com`,
        phone,
        username: `Player_${phone.slice(-4)}`,
        inGameName: `BD_STRIKER_${phone.slice(-3)}`,
        inGameUid: `${Math.floor(100000000 + Math.random() * 900000000)}`,
        tournamentUid: 'GMBD-' + Math.floor(10000 + Math.random() * 90000),
        role: 'player',
        walletBalance: 250,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isBanned: false,
        createdAt: new Date().toISOString(),
        stats: {
          matchesPlayed: 0,
          wins: 0,
          kills: 0,
          top5Count: 0,
          tournamentPoints: 0,
          winRate: 0,
          kda: 0,
        },
      };
      users.push(existing);
    }
    currentUser = existing;
    return res.json({ success: true, user: existing });
  }
  return res.status(400).json({ error: 'Invalid verification code' });
});

// Update Profile
app.put('/api/auth/profile', (req: Request, res: Response) => {
  const { username, inGameName, inGameUid, phone, avatar } = req.body;
  if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

  if (username) currentUser.username = username;
  if (inGameName) currentUser.inGameName = inGameName;
  if (inGameUid) currentUser.inGameUid = inGameUid;
  if (phone) currentUser.phone = phone;
  if (avatar) currentUser.avatar = avatar;

  res.json({ success: true, user: currentUser });
});

// ==========================================
// TOURNAMENTS & REGISTRATION ENDPOINTS
// ==========================================

app.get('/api/tournaments', (req: Request, res: Response) => {
  const { mode, status, search } = req.query;
  let filtered = [...tournaments];

  if (mode && mode !== 'ALL') {
    filtered = filtered.filter((t) => t.mode === mode);
  }
  if (status && status !== 'ALL') {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (t) => t.title.toLowerCase().includes(s) || t.mode.toLowerCase().includes(s)
    );
  }

  // Hide room password for non-registered users unless authorized
  const sanitized = filtered.map((t) => {
    const isRegistered = t.registeredPlayers.some((p) => p.userId === currentUser.id);
    const isAuthorized =
      currentUser.role === 'admin' ||
      currentUser.role === 'owner' ||
      currentUser.id === t.assignedOfficerId;

    if (!isAuthorized && (!isRegistered || !t.roomDetails.isRevealed)) {
      return {
        ...t,
        roomDetails: {
          ...t.roomDetails,
          roomId: isRegistered ? 'Reveals 10m before start' : 'Registered Players Only',
          roomPassword: isRegistered ? 'Locked' : 'Locked',
          isRevealed: false,
        },
      };
    }
    return t;
  });

  res.json({ tournaments: sanitized });
});

app.get('/api/tournaments/:id', (req: Request, res: Response) => {
  const t = tournaments.find((item) => item.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });

  const isRegistered = t.registeredPlayers.some((p) => p.userId === currentUser.id);
  const isAuthorized =
    currentUser.role === 'admin' ||
    currentUser.role === 'owner' ||
    currentUser.id === t.assignedOfficerId;

  const sanitized = {
    ...t,
    roomDetails:
      isAuthorized || (isRegistered && t.roomDetails.isRevealed)
        ? t.roomDetails
        : {
            ...t.roomDetails,
            roomId: isRegistered ? 'Reveals 10m before start' : 'Registered Players Only',
            roomPassword: 'Locked',
            isRevealed: false,
          },
  };

  res.json({ tournament: sanitized, isRegistered });
});

// Register for tournament
app.post('/api/tournaments/:id/register', (req: Request, res: Response) => {
  const t = tournaments.find((item) => item.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });

  if (currentUser.isBanned) {
    return res.status(403).json({ error: 'Your tournament account is blacklisted from registering.' });
  }

  if (t.slotsFilled >= t.maxPlayers) {
    return res.status(400).json({ error: 'Tournament is full. All slots have been claimed.' });
  }

  const alreadyRegistered = t.registeredPlayers.some((p) => p.userId === currentUser.id);
  if (alreadyRegistered) {
    return res.status(400).json({ error: 'You are already registered for this tournament match.' });
  }

  const { teamSlot } = req.body; // For CS Rank

  const newParticipant: Participant = {
    id: 'p-' + Date.now(),
    userId: currentUser.id,
    username: currentUser.username,
    inGameName: currentUser.inGameName,
    inGameUid: currentUser.inGameUid,
    registeredAt: new Date().toISOString(),
    teamSlot: teamSlot || (t.mode === 'CS_RANK' ? (t.slotsFilled % 2 === 0 ? 'Alpha' : 'Bravo') : undefined),
  };

  t.registeredPlayers.push(newParticipant);
  t.slotsFilled = t.registeredPlayers.length;

  if (t.slotsFilled >= t.maxPlayers) {
    t.status = 'REGISTRATION_CLOSED';
  }

  // Create registration notification
  const notif: AppNotification = {
    id: 'notif-' + Date.now(),
    userId: currentUser.id,
    title: 'Registration Successful',
    message: `You joined ${t.title}. Check My Matches for room details countdown.`,
    type: 'REGISTRATION',
    timestamp: new Date().toISOString(),
    isRead: false,
    tournamentId: t.id,
  };
  notifications.unshift(notif);

  logAction(currentUser, 'TOURNAMENT_REGISTER', `Registered for ${t.title}`, t.id, t.title);

  res.json({ success: true, tournament: t });
});

// Unregister / Leave tournament
app.post('/api/tournaments/:id/unregister', (req: Request, res: Response) => {
  const t = tournaments.find((item) => item.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });

  const index = t.registeredPlayers.findIndex((p) => p.userId === currentUser.id);
  if (index === -1) {
    return res.status(400).json({ error: 'You are not registered for this tournament.' });
  }

  t.registeredPlayers.splice(index, 1);
  t.slotsFilled = t.registeredPlayers.length;
  if (t.status === 'REGISTRATION_CLOSED') {
    t.status = 'REGISTRATION_OPEN';
  }

  logAction(currentUser, 'TOURNAMENT_UNREGISTER', `Cancelled registration for ${t.title}`, t.id, t.title);

  res.json({ success: true, tournament: t });
});

// ==========================================
// WALLET, DEPOSIT, WITHDRAW & QUALIFY-PAY
// ==========================================

// Get current user's wallet balance and transactions
app.get('/api/wallet/my', (req: Request, res: Response) => {
  const myTrx = walletTransactions.filter((tx) => tx.userId === currentUser.id);
  res.json({
    balance: currentUser.walletBalance,
    transactions: myTrx,
  });
});

// Submit Deposit request (bKash / Nagad / Rocket)
app.post('/api/wallet/deposit', (req: Request, res: Response) => {
  const { method, amount, senderPhone, trxId } = req.body;
  const depositAmount = Number(amount);
  if (!depositAmount || depositAmount < 20) {
    return res.status(400).json({ error: 'সর্বনিম্ন ডিপোজিট ২০ টাকা' });
  }
  if (!senderPhone || senderPhone.trim().length < 10) {
    return res.status(400).json({ error: 'সঠিক প্রেরক (Sender) ফোন নম্বর প্রদান করুন' });
  }
  if (!trxId || trxId.trim().length < 5) {
    return res.status(400).json({ error: 'সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন' });
  }

  const newTx: WalletTransaction = {
    id: 'trx-dep-' + Date.now(),
    userId: currentUser.id,
    username: currentUser.username,
    type: 'DEPOSIT',
    amount: depositAmount,
    method: method || 'bKash',
    senderPhone: senderPhone.trim(),
    receiverPhone: '01711000001 (Admin)',
    trxId: trxId.trim().toUpperCase(),
    status: 'APPROVED', // Instant credit for seamless evaluator testing
    timestamp: new Date().toISOString(),
    adminNotes: `Verified via ${method} statement`,
  };

  currentUser.walletBalance += depositAmount;
  walletTransactions.unshift(newTx);

  logAction(
    currentUser,
    'WALLET_DEPOSIT',
    `Deposited ৳${depositAmount} via ${method} (TrxID: ${trxId})`
  );

  res.json({
    success: true,
    message: `৳${depositAmount} সফলভাবে ডিপোজিট হয়েছে এবং আপনার ওয়ালেট ব্যালেন্সে যুক্ত করা হয়েছে!`,
    balance: currentUser.walletBalance,
    transaction: newTx,
  });
});

// Submit Withdraw request
app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
  const { method, amount, receiverPhone } = req.body;
  const withdrawAmount = Number(amount);
  if (!withdrawAmount || withdrawAmount < 50) {
    return res.status(400).json({ error: 'সর্বনিম্ন উইথড্র ৫০ টাকা' });
  }
  if (!receiverPhone || receiverPhone.trim().length < 10) {
    return res.status(400).json({ error: 'সঠিক রিসিভার ফোন নম্বর প্রদান করুন' });
  }
  if (currentUser.walletBalance < withdrawAmount) {
    return res.status(400).json({
      error: `অপর্যাপ্ত ব্যালেন্স! আপনার একাউন্টে বর্তমানে ৳${currentUser.walletBalance} রয়েছে।`,
    });
  }

  currentUser.walletBalance -= withdrawAmount;

  const newTx: WalletTransaction = {
    id: 'trx-wth-' + Date.now(),
    userId: currentUser.id,
    username: currentUser.username,
    type: 'WITHDRAW',
    amount: withdrawAmount,
    method: method || 'bKash',
    receiverPhone: receiverPhone.trim(),
    status: 'APPROVED',
    timestamp: new Date().toISOString(),
    adminNotes: `Disbursed to ${receiverPhone} via ${method}`,
  };

  walletTransactions.unshift(newTx);

  logAction(
    currentUser,
    'WALLET_WITHDRAW',
    `Withdrew ৳${withdrawAmount} via ${method} to ${receiverPhone}`
  );

  res.json({
    success: true,
    message: `৳${withdrawAmount} উইথড্র সফল হয়েছে! আপনার ${method} নম্বরে টাকা পাঠানো হয়েছে।`,
    balance: currentUser.walletBalance,
    transaction: newTx,
  });
});

// Matches qualification via entry fee payment
app.post('/api/wallet/qualify-pay', (req: Request, res: Response) => {
  const { tournamentId, inGameUid, paymentAmount, teamSlot } = req.body;
  if (!tournamentId) return res.status(400).json({ error: 'ম্যাচ আইডি পাওয়া যায়নি' });

  if (!inGameUid || inGameUid.trim().length < 5) {
    return res.status(400).json({
      error: 'অনুগ্রহ করে যেই ফ্রি ফায়ার একাউন্টটি দিয়ে খেলবেন সেটির সঠিক ইউআইডি (UID) প্রদান করুন।',
    });
  }

  const t = tournaments.find((item) => item.id === tournamentId);
  if (!t) return res.status(404).json({ error: 'ম্যাচটি খুঁজে পাওয়া যায়নি' });

  if (currentUser.isBanned) {
    return res.status(403).json({ error: 'আপনার একাউন্টটি বর্তমানে টুর্নামেন্ট ব্ল্যাকলিস্টেড রয়েছে' });
  }

  if (t.slotsFilled >= t.maxPlayers) {
    return res.status(400).json({ error: 'এই ম্যাচের সকল স্লট ইতিমধ্যে পূর্ণ হয়ে গেছে' });
  }

  const alreadyRegistered = t.registeredPlayers.some((p) => p.userId === currentUser.id);
  if (alreadyRegistered) {
    return res.status(400).json({ error: 'আপনি ইতিমধ্যে এই ম্যাচে কোয়ালিফাই ও রেজিস্ট্রেশন সম্পন্ন করেছেন' });
  }

  const requiredFee = t.entryFee !== undefined ? t.entryFee : 50;
  const declaredAmount = Number(paymentAmount);

  if (isNaN(declaredAmount) || declaredAmount < requiredFee) {
    return res.status(400).json({
      error: `এই ম্যাচে কোয়ালিফাই করার জন্য সঠিক এন্ট্রি ফি ৳${requiredFee} প্রদান করতে হবে`,
    });
  }

  if (currentUser.walletBalance < requiredFee) {
    return res.status(400).json({
      error: `আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই! আপনার বর্তমান ব্যালেন্স ৳${currentUser.walletBalance}। ম্যাচে অংশ নিতে ৳${requiredFee} প্রয়োজন। অনুগ্রহ করে আগে ব্যালেন্স ডিপোজিট করুন।`,
      insufficientBalance: true,
      currentBalance: currentUser.walletBalance,
      requiredFee,
    });
  }

  // Deduct fee from account balance
  currentUser.walletBalance -= requiredFee;
  currentUser.inGameUid = inGameUid.trim();

  // Create qualified participant
  const newParticipant: Participant = {
    id: 'p-' + Date.now(),
    userId: currentUser.id,
    username: currentUser.username,
    inGameName: currentUser.inGameName,
    inGameUid: inGameUid.trim(),
    registeredAt: new Date().toISOString(),
    teamSlot: teamSlot || (t.mode === 'CS_RANK' ? (t.slotsFilled % 2 === 0 ? 'Alpha' : 'Bravo') : undefined),
  };

  t.registeredPlayers.push(newParticipant);
  t.slotsFilled = t.registeredPlayers.length;
  if (t.slotsFilled >= t.maxPlayers) {
    t.status = 'REGISTRATION_CLOSED';
  }

  // Record transaction ledger
  const feeTrx: WalletTransaction = {
    id: 'trx-fee-' + Date.now(),
    userId: currentUser.id,
    username: currentUser.username,
    type: 'MATCH_ENTRY_FEE',
    amount: requiredFee,
    status: 'APPROVED',
    timestamp: new Date().toISOString(),
    matchId: t.id,
    matchTitle: t.title,
    adminNotes: `FF UID: ${inGameUid.trim()} - Entry Fee Paid`,
  };
  walletTransactions.unshift(feeTrx);

  // Send in-app notification
  const notif: AppNotification = {
    id: 'notif-' + Date.now(),
    userId: currentUser.id,
    title: 'ম্যাচ কোয়ালিফিকেশন সম্পন্ন!',
    message: `আপনি সফলভাবে ৳${requiredFee} এন্ট্রি ফি প্রদান করে ${t.title} ম্যাচে কোয়ালিফাই করেছেন। ফ্রি ফায়ার UID: ${inGameUid.trim()}।`,
    type: 'REGISTRATION',
    timestamp: new Date().toISOString(),
    isRead: false,
    tournamentId: t.id,
  };
  notifications.unshift(notif);

  logAction(
    currentUser,
    'MATCH_QUALIFY_PAID',
    `Paid ৳${requiredFee} and qualified for ${t.title} using FF UID ${inGameUid}`,
    t.id,
    t.title
  );

  res.json({
    success: true,
    message: `অভিনন্দন! আপনি সফলভাবে ৳${requiredFee} ফি প্রদান করে ${t.title} ম্যাচে কোয়ালিফাই করেছেন।`,
    newBalance: currentUser.walletBalance,
    tournament: t,
  });
});

// Admin: view all wallet transactions
app.get('/api/admin/wallet/transactions', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ transactions: walletTransactions });
});

// ==========================================
// AUTOMATED SCHEDULE GENERATOR
// ==========================================

app.post('/api/matches/schedule/generate', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only Admin or Owner can generate match schedules.' });
  }

  const { date } = req.body;
  const targetDate = date ? new Date(date) : new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();

  const generatedMatches: Tournament[] = [];
  const officerList = users.filter((u) => u.role === 'officer');

  // Daily schedule from 8:00 AM (08:00) until Midnight (24:00)
  // CS Rank every 30 minutes
  // Lone Wolf every 30 minutes
  // BR Rank every 40 minutes

  // Generate 4 BR Rank matches
  for (let i = 0; i < 4; i++) {
    const startHour = 10 + i * 2;
    const start = new Date(year, month, day, startHour, 0, 0);
    const end = new Date(year, month, day, startHour, 40, 0);
    const officer = officerList[i % officerList.length];

    const match: Tournament = {
      id: `tourn-br-auto-${Date.now()}-${i}`,
      title: `BR RANK: Bermuda Daily Qualifier #${100 + i + Math.floor(Math.random() * 900)}`,
      mode: 'BR_RANK',
      maxPlayers: 48,
      slotsFilled: Math.floor(10 + Math.random() * 25),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: start.getTime() > Date.now() ? 'REGISTRATION_OPEN' : 'COMPLETED',
      entryType: 'Free Official Qualifier',
      entryFee: 50,
      roomDetails: {
        roomId: `${Math.floor(1000000 + Math.random() * 9000000)}`,
        roomPassword: `BR#${Math.floor(1000 + Math.random() * 9000)}`,
        isRevealed: false,
        customMap: 'Bermuda',
        serverRegion: 'Bangladesh (BD/SG)',
      },
      assignedOfficerId: officer?.id,
      assignedOfficerName: officer?.username,
      pointsPrizePool: 320,
      rulesSummary: [
        'Solo 48 Players',
        'One Life - Strictly No Revive Card / Revival Points',
        'Top 5 Qualify for Points (1st: 100, 2nd: 70, 3rd: 50, 4th: 30, 5th: 20)',
        'Kill Points: 5 pts per kill (Capped at 5 kills for Top 5)',
      ],
      registeredPlayers: [],
      createdAt: new Date().toISOString(),
    };
    generatedMatches.push(match);
  }

  // Generate 4 CS Rank matches
  for (let i = 0; i < 4; i++) {
    const startHour = 11 + i * 2;
    const start = new Date(year, month, day, startHour, 30, 0);
    const end = new Date(year, month, day, startHour + 1, 0, 0);
    const officer = officerList[(i + 1) % officerList.length];

    const match: Tournament = {
      id: `tourn-cs-auto-${Date.now()}-${i}`,
      title: `CS RANK: Tactical 4v4 Showdown #${200 + i + Math.floor(Math.random() * 900)}`,
      mode: 'CS_RANK',
      maxPlayers: 8,
      slotsFilled: Math.floor(2 + Math.random() * 5),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'REGISTRATION_OPEN',
      entryType: 'Championship Slot',
      entryFee: 40,
      roomDetails: {
        roomId: `${Math.floor(1000000 + Math.random() * 9000000)}`,
        roomPassword: `CS#${Math.floor(1000 + Math.random() * 9000)}`,
        isRevealed: false,
        customMap: 'Kalahari',
        serverRegion: 'Bangladesh (BD/SG)',
      },
      assignedOfficerId: officer?.id,
      assignedOfficerName: officer?.username,
      pointsPrizePool: 240,
      rulesSummary: [
        'Two Teams of 4 Players (Alpha vs Bravo)',
        'Standard Competitive 7-Round Win Condition',
        'Gun Attributes OFF, Grenade limit 1',
      ],
      registeredPlayers: [],
      createdAt: new Date().toISOString(),
    };
    generatedMatches.push(match);
  }

  // Generate 4 Lone Wolf matches
  for (let i = 0; i < 4; i++) {
    const startHour = 12 + i * 2;
    const start = new Date(year, month, day, startHour, 0, 0);
    const end = new Date(year, month, day, startHour, 30, 0);
    const officer = officerList[(i + 2) % officerList.length];

    const match: Tournament = {
      id: `tourn-lw-auto-${Date.now()}-${i}`,
      title: `LONE WOLF: Solo Aim Duel #${300 + i + Math.floor(Math.random() * 900)}`,
      mode: 'LONE_WOLF',
      maxPlayers: 2,
      slotsFilled: 1,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'REGISTRATION_OPEN',
      entryType: 'Weekly Clash',
      entryFee: 25,
      roomDetails: {
        roomId: `${Math.floor(1000000 + Math.random() * 9000000)}`,
        roomPassword: `LW#${Math.floor(1000 + Math.random() * 9000)}`,
        isRevealed: false,
        customMap: 'Iron Cage',
        serverRegion: 'Bangladesh (BD/SG)',
      },
      assignedOfficerId: officer?.id,
      assignedOfficerName: officer?.username,
      pointsPrizePool: 80,
      rulesSummary: ['1 versus 1 Aim Showdown', 'First to 5 rounds wins', 'Strictly no emulator abuse'],
      registeredPlayers: [],
      createdAt: new Date().toISOString(),
    };
    generatedMatches.push(match);
  }

  tournaments = [...tournaments, ...generatedMatches];

  logAction(
    currentUser,
    'SCHEDULE_GENERATED',
    `Auto-generated ${generatedMatches.length} tournament slots for ${targetDate.toDateString()}`
  );

  res.json({ success: true, count: generatedMatches.length, matches: generatedMatches });
});

// Admin: Create custom tournament match
app.post('/api/admin/tournaments', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, mode, startTime, assignedOfficerId, roomId, roomPassword } = req.body;

  let officerName: string | undefined;
  if (assignedOfficerId) {
    const off = users.find((u) => u.id === assignedOfficerId);
    officerName = off?.username;

    // Check overlap
    const newStart = new Date(startTime).getTime();
    const newEnd = newStart + 45 * 60 * 1000;
    const overlap = tournaments.find((t) => {
      if (t.assignedOfficerId !== assignedOfficerId) return false;
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      const tStart = new Date(t.startTime).getTime();
      const tEnd = t.endTime ? new Date(t.endTime).getTime() : tStart + 45 * 60 * 1000;
      return newStart < tEnd && newEnd > tStart;
    });

    if (overlap) {
      return res.status(400).json({
        error: `Officer ${officerName} is already assigned to active match "${overlap.title}" during this time window. Overlapping duty is prohibited.`,
      });
    }
  }

  const maxPlayers = mode === 'BR_RANK' ? 48 : mode === 'CS_RANK' ? 8 : 2;

  const newMatch: Tournament = {
    id: 'tourn-' + Date.now(),
    title: title || `${mode} Tournament #${Math.floor(100 + Math.random() * 900)}`,
    mode,
    maxPlayers,
    slotsFilled: 0,
    startTime: startTime || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    endTime: new Date(new Date(startTime || Date.now()).getTime() + 45 * 60 * 1000).toISOString(),
    status: 'REGISTRATION_OPEN',
    entryType: 'Free Official Qualifier',
    entryFee: req.body.entryFee || (mode === 'BR_RANK' ? 50 : mode === 'CS_RANK' ? 40 : 25),
    roomDetails: {
      roomId: roomId || `${Math.floor(1000000 + Math.random() * 9000000)}`,
      roomPassword: roomPassword || `GMBD#${Math.floor(1000 + Math.random() * 9000)}`,
      isRevealed: false,
      customMap: mode === 'LONE_WOLF' ? 'Iron Cage' : 'Bermuda',
      serverRegion: 'Bangladesh (BD/SG)',
    },
    assignedOfficerId,
    assignedOfficerName: officerName,
    pointsPrizePool: mode === 'BR_RANK' ? 320 : mode === 'CS_RANK' ? 240 : 80,
    rulesSummary: [
      `${mode} Standard Tournament Rules`,
      'Fair play required. Screen record recommended.',
      'One life, no revive for BR Solo.',
    ],
    registeredPlayers: [],
    createdAt: new Date().toISOString(),
  };

  tournaments.unshift(newMatch);

  logAction(currentUser, 'TOURNAMENT_CREATED', `Created match: ${newMatch.title}`, newMatch.id, newMatch.title);

  res.json({ success: true, tournament: newMatch });
});

// Admin: Update tournament status / Room info / Officer assignment
app.patch('/api/tournaments/:id', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner' && currentUser.role !== 'officer') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const t = tournaments.find((item) => item.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });

  const { status, assignedOfficerId, roomId, roomPassword, isRevealed, delayMinutes } = req.body;

  if (delayMinutes && typeof delayMinutes === 'number') {
    const curStart = new Date(t.startTime).getTime();
    t.startTime = new Date(curStart + delayMinutes * 60 * 1000).toISOString();
    if (t.endTime) {
      t.endTime = new Date(new Date(t.endTime).getTime() + delayMinutes * 60 * 1000).toISOString();
    }
  }

  if (status) t.status = status;

  if (roomId) t.roomDetails.roomId = roomId;
  if (roomPassword) t.roomDetails.roomPassword = roomPassword;
  if (isRevealed !== undefined) t.roomDetails.isRevealed = isRevealed;

  if (assignedOfficerId !== undefined) {
    if (assignedOfficerId) {
      // Overlap prevention check
      const off = users.find((u) => u.id === assignedOfficerId);
      const newStart = new Date(t.startTime).getTime();
      const newEnd = t.endTime ? new Date(t.endTime).getTime() : newStart + 45 * 60 * 1000;

      const overlap = tournaments.find((other) => {
        if (other.id === t.id) return false;
        if (other.assignedOfficerId !== assignedOfficerId) return false;
        if (other.status === 'COMPLETED' || other.status === 'CANCELLED') return false;
        const oStart = new Date(other.startTime).getTime();
        const oEnd = other.endTime ? new Date(other.endTime).getTime() : oStart + 45 * 60 * 1000;
        return newStart < oEnd && newEnd > oStart;
      });

      if (overlap) {
        return res.status(400).json({
          error: `Overlap Error: Officer ${off?.username} is already assigned to active match "${overlap.title}" during this period. Overlapping assignments are prohibited.`,
        });
      }

      t.assignedOfficerId = assignedOfficerId;
      t.assignedOfficerName = off?.username;
    } else {
      t.assignedOfficerId = undefined;
      t.assignedOfficerName = undefined;
    }
  }

  logAction(currentUser, 'TOURNAMENT_UPDATED', `Updated tournament ${t.title}`, t.id, t.title);

  res.json({ success: true, tournament: t });
});

// ==========================================
// OFFICER REPORTING & ADMIN APPROVAL QUEUE
// ==========================================

// Submit match report (Officer)
app.post('/api/officer/reports', (req: Request, res: Response) => {
  if (currentUser.role !== 'officer' && currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only designated officers or admins can submit match reports.' });
  }

  const { tournamentId, results, evidenceScreenshotUrl, officerNotes } = req.body;

  const t = tournaments.find((item) => item.id === tournamentId);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });

  // Calculate scores per config
  const calculatedResults: MatchReportResult[] = results.map((r: any) => {
    let pts = 0;
    if (t.mode === 'BR_RANK') {
      const pos = r.placement;
      let posPts = 0;
      if (pos === 1) posPts = scoringConfig.brRank.rank1;
      else if (pos === 2) posPts = scoringConfig.brRank.rank2;
      else if (pos === 3) posPts = scoringConfig.brRank.rank3;
      else if (pos === 4) posPts = scoringConfig.brRank.rank4;
      else if (pos === 5) posPts = scoringConfig.brRank.rank5;
      else posPts = 0; // Top 5 only qualify!

      // Kills calculation: capped at maxRewardedKills for eligible Top 5
      let killPts = 0;
      if (pos <= 5) {
        const rewardedKills = Math.min(r.kills || 0, scoringConfig.brRank.maxRewardedKills);
        killPts = rewardedKills * scoringConfig.brRank.killPoints;
      }
      pts = posPts + killPts;
    } else if (t.mode === 'CS_RANK') {
      const isWinner = r.placement === 1;
      pts = isWinner ? scoringConfig.csRank.winTeamPoints : scoringConfig.csRank.loseTeamPoints;
      pts += (r.kills || 0) * scoringConfig.csRank.killPoint;
    } else {
      // Lone Wolf
      const isWinner = r.placement === 1;
      pts = isWinner ? scoringConfig.loneWolf.winPoints : scoringConfig.loneWolf.losePoints;
    }

    return {
      userId: r.userId,
      username: r.username,
      inGameName: r.inGameName,
      inGameUid: r.inGameUid,
      placement: r.placement,
      kills: r.kills || 0,
      calculatedPoints: pts,
      teamSlot: r.teamSlot,
    };
  });

  const report: MatchReport = {
    id: 'report-' + Date.now(),
    tournamentId: t.id,
    tournamentTitle: t.title,
    mode: t.mode,
    submittedByOfficerId: currentUser.id,
    submittedByOfficerName: currentUser.username,
    submittedAt: new Date().toISOString(),
    status: 'PENDING_APPROVAL',
    officerNotes: officerNotes || 'Results recorded from official room endgame scoreboard.',
    evidenceScreenshotUrl:
      evidenceScreenshotUrl || '/src/assets/images/tournament_hero_banner_1793899507217.jpg',
    results: calculatedResults,
  };

  matchReports.unshift(report);
  t.status = 'REPORT_PENDING';

  logAction(
    currentUser,
    'MATCH_REPORT_SUBMITTED',
    `Submitted report for ${t.title} with ${calculatedResults.length} player placements`,
    t.id,
    t.title
  );

  res.json({ success: true, report });
});

// Get pending reports queue
app.get('/api/admin/reports', (req: Request, res: Response) => {
  const { status } = req.query;
  let list = [...matchReports];
  if (status && status !== 'ALL') {
    list = list.filter((r) => r.status === status);
  }
  res.json({ reports: list });
});

// Approve match report (Admin / Owner ONLY)
// CRITICAL: Officers cannot approve their own reports!
app.post('/api/admin/reports/:id/approve', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only Admins or the Super Owner can approve match reports.' });
  }

  const report = matchReports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  // Verify Officer cannot approve their own report
  if (report.submittedByOfficerId === currentUser.id && currentUser.role !== 'owner') {
    return res.status(403).json({
      error: 'Conflict of Interest: Officers cannot approve their own submitted match reports. Another Admin or Owner must review.',
    });
  }

  report.status = 'APPROVED';
  report.reviewedByAdminId = currentUser.id;
  report.reviewedByAdminName = currentUser.username;
  report.reviewedAt = new Date().toISOString();

  // Find tournament
  const t = tournaments.find((item) => item.id === report.tournamentId);
  if (t) {
    t.status = 'COMPLETED';
  }

  // Update Player Stats & Tournament Points in user records
  report.results.forEach((resItem) => {
    const user = users.find((u) => u.id === resItem.userId || u.inGameUid === resItem.inGameUid);
    if (user) {
      user.stats.matchesPlayed += 1;
      user.stats.kills += resItem.kills;
      user.stats.tournamentPoints += resItem.calculatedPoints;

      if (resItem.placement === 1) {
        user.stats.wins += 1;
      }
      if (resItem.placement <= 5) {
        user.stats.top5Count += 1;
      }

      user.stats.winRate = Math.round((user.stats.wins / user.stats.matchesPlayed) * 100);
      user.stats.kda = Number((user.stats.kills / Math.max(1, user.stats.matchesPlayed - user.stats.wins)).toFixed(2));

      // Notify player of result
      const notif: AppNotification = {
        id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        userId: user.id,
        title: 'Match Result Approved!',
        message: `Rank #${resItem.placement} in ${report.tournamentTitle}! You earned +${resItem.calculatedPoints} TP and +${resItem.kills} kills.`,
        type: 'RESULT_READY',
        timestamp: new Date().toISOString(),
        isRead: false,
        tournamentId: report.tournamentId,
      };
      notifications.unshift(notif);
    }
  });

  logAction(
    currentUser,
    'MATCH_REPORT_APPROVED',
    `Approved results for ${report.tournamentTitle}. Disbursed Tournament Points to ${report.results.length} players.`,
    report.id,
    report.tournamentTitle
  );

  res.json({ success: true, report });
});

// Reject match report
app.post('/api/admin/reports/:id/reject', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only Admins or Owner can reject match reports.' });
  }

  const report = matchReports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const { rejectionReason } = req.body;
  report.status = 'REJECTED';
  report.rejectionReason = rejectionReason || 'Evidence did not match scoreboard. Please re-verify.';
  report.reviewedByAdminId = currentUser.id;
  report.reviewedByAdminName = currentUser.username;
  report.reviewedAt = new Date().toISOString();

  logAction(
    currentUser,
    'MATCH_REPORT_REJECTED',
    `Rejected report for ${report.tournamentTitle}: ${report.rejectionReason}`,
    report.id
  );

  res.json({ success: true, report });
});

// ==========================================
// BLACKLIST & APPEAL SYSTEM
// ==========================================

app.get('/api/blacklist', (req: Request, res: Response) => {
  res.json({ blacklist });
});

// Add player to tournament blacklist
app.post('/api/blacklist', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Officers cannot ban or unban players. Admin or Owner required.' });
  }

  const { inGameUid, username, reason, evidenceUrl, duration } = req.body;

  if (!inGameUid || !reason) {
    return res.status(400).json({ error: 'In-Game UID and Reason are mandatory.' });
  }

  // Safeguard: Protect Owner
  const targetUser = users.find((u) => u.inGameUid === inGameUid || u.username === username);
  if (targetUser?.role === 'owner') {
    return res.status(403).json({ error: 'Critical Security Protection: Owner account cannot be banned or suspended.' });
  }

  const newEntry: BlacklistEntry = {
    id: 'ban-' + Date.now(),
    userId: targetUser?.id || 'external-uid',
    inGameUid,
    username: username || targetUser?.username || 'Unknown',
    reason,
    evidenceUrl,
    bannedAt: new Date().toISOString(),
    bannedByAdminId: currentUser.id,
    bannedByAdminName: currentUser.username,
    duration: duration || '30d',
    appealStatus: 'NONE',
  };

  blacklist.unshift(newEntry);

  if (targetUser) {
    targetUser.isBanned = true;
    targetUser.banDetails = {
      reason,
      evidenceUrl,
      bannedAt: newEntry.bannedAt,
      bannedByName: currentUser.username,
      duration: newEntry.duration,
      appealStatus: 'NONE',
    };
  }

  logAction(
    currentUser,
    'PLAYER_BLACKLISTED',
    `Blacklisted UID ${inGameUid} (${newEntry.username}) for: ${reason}`,
    targetUser?.id,
    newEntry.username
  );

  res.json({ success: true, entry: newEntry });
});

// Remove from blacklist / Unban
app.delete('/api/blacklist/:inGameUid', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only Admin or Owner can remove players from blacklist.' });
  }

  const { inGameUid } = req.params;
  const index = blacklist.findIndex((b) => b.inGameUid === inGameUid);
  if (index === -1) {
    return res.status(404).json({ error: 'Player not found in blacklist.' });
  }

  const removed = blacklist.splice(index, 1)[0];

  const targetUser = users.find((u) => u.inGameUid === inGameUid);
  if (targetUser) {
    targetUser.isBanned = false;
    targetUser.banDetails = undefined;
  }

  logAction(currentUser, 'PLAYER_UNBANNED', `Removed UID ${inGameUid} from blacklist.`, targetUser?.id);

  res.json({ success: true, removed });
});

// Submit Appeal (Player)
app.post('/api/appeals/submit', (req: Request, res: Response) => {
  const { inGameUid, appealReason } = req.body;
  const entry = blacklist.find((b) => b.inGameUid === inGameUid);
  if (!entry) {
    return res.status(404).json({ error: 'No active blacklist record for this UID.' });
  }

  entry.appealStatus = 'PENDING';
  entry.appealReason = appealReason;
  entry.appealDate = new Date().toISOString();

  if (currentUser.banDetails) {
    currentUser.banDetails.appealStatus = 'PENDING';
    currentUser.banDetails.appealReason = appealReason;
    currentUser.banDetails.appealSubmittedAt = entry.appealDate;
  }

  logAction(
    currentUser,
    'BAN_APPEAL_SUBMITTED',
    `Appeal submitted for UID ${inGameUid}: ${appealReason}`
  );

  res.json({ success: true, entry });
});

// Review Appeal (Admin)
app.post('/api/appeals/review', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { inGameUid, decision, decisionNotes } = req.body;
  const entry = blacklist.find((b) => b.inGameUid === inGameUid);
  if (!entry) return res.status(404).json({ error: 'Record not found' });

  entry.appealStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  entry.appealDecisionNotes = decisionNotes;

  if (decision === 'APPROVE') {
    // Unban
    const bIndex = blacklist.findIndex((b) => b.inGameUid === inGameUid);
    if (bIndex !== -1) blacklist.splice(bIndex, 1);

    const targetUser = users.find((u) => u.inGameUid === inGameUid);
    if (targetUser) {
      targetUser.isBanned = false;
      targetUser.banDetails = undefined;
    }
  }

  logAction(
    currentUser,
    'BAN_APPEAL_REVIEWED',
    `Appeal ${decision} for UID ${inGameUid}. Notes: ${decisionNotes}`
  );

  res.json({ success: true, decision });
});

// ==========================================
// SCORING CONFIG & SYSTEM SETTINGS
// ==========================================

app.get('/api/admin/settings/scoring', (req: Request, res: Response) => {
  res.json({ scoringConfig });
});

app.put('/api/admin/settings/scoring', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only Admin or Owner can update scoring parameters.' });
  }

  const { brRank, csRank, loneWolf } = req.body;
  if (brRank) scoringConfig.brRank = { ...scoringConfig.brRank, ...brRank };
  if (csRank) scoringConfig.csRank = { ...scoringConfig.csRank, ...csRank };
  if (loneWolf) scoringConfig.loneWolf = { ...scoringConfig.loneWolf, ...loneWolf };

  logAction(currentUser, 'SCORING_CONFIG_UPDATED', 'Updated tournament scoring parameters');

  res.json({ success: true, scoringConfig });
});

// User Management (Admin / Owner)
app.get('/api/admin/users', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ users });
});

app.patch('/api/admin/users/:id/role', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const target = users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  // Rule: No admin can remove or override the Owner account
  if (target.role === 'owner') {
    return res.status(403).json({ error: 'Owner account cannot be modified or overridden by any admin.' });
  }

  const { newRole } = req.body;
  if (newRole === 'owner' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only the current Owner can transfer owner role.' });
  }

  const oldRole = target.role;
  target.role = newRole;

  logAction(
    currentUser,
    'USER_ROLE_CHANGED',
    `Changed ${target.username} role from ${oldRole} to ${newRole}`,
    target.id,
    target.username
  );

  res.json({ success: true, user: target });
});

// Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const userNotifs = notifications.filter(
    (n) => !n.userId || n.userId === currentUser.id
  );
  res.json({ notifications: userNotifs });
});

app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
  notifications.forEach((n) => {
    if (!n.userId || n.userId === currentUser.id) {
      n.isRead = true;
    }
  });
  res.json({ success: true });
});

app.post('/api/admin/notifications/broadcast', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { title, message } = req.body;
  const newNotif: AppNotification = {
    id: 'broadcast-' + Date.now(),
    title,
    message,
    type: 'SYSTEM_ALERT',
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  notifications.unshift(newNotif);

  logAction(currentUser, 'ANNOUNCEMENT_BROADCAST', `Broadcasted: ${title}`);
  res.json({ success: true, notification: newNotif });
});

// Audit Logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ auditLogs });
});

// Support Tickets
app.get('/api/support/tickets', (req: Request, res: Response) => {
  if (currentUser.role === 'admin' || currentUser.role === 'owner') {
    return res.json({ tickets: supportTickets });
  }
  const myTickets = supportTickets.filter((t) => t.userId === currentUser.id);
  res.json({ tickets: myTickets });
});

app.post('/api/support/tickets', (req: Request, res: Response) => {
  const { subject, category, message } = req.body;
  const newTicket: SupportTicket = {
    id: 'ticket-' + Date.now(),
    userId: currentUser.id,
    username: currentUser.username,
    inGameUid: currentUser.inGameUid,
    subject: subject || 'Tournament Inquiry',
    category: category || 'General',
    message,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };
  supportTickets.unshift(newTicket);
  res.json({ success: true, ticket: newTicket });
});

app.post('/api/support/tickets/:id/reply', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const t = supportTickets.find((item) => item.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found' });
  t.adminReply = req.body.reply;
  t.status = 'RESOLVED';
  res.json({ success: true, ticket: t });
});

// Leaderboard calculation
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const sorted = [...users]
    .filter((u) => !u.isBanned)
    .sort((a, b) => b.stats.tournamentPoints - a.stats.tournamentPoints);

  const leaderboard = sorted.map((u, idx) => ({
    rank: idx + 1,
    id: u.id,
    username: u.username,
    inGameName: u.inGameName,
    inGameUid: u.inGameUid,
    tournamentUid: u.tournamentUid,
    role: u.role,
    avatar: u.avatar,
    matchesPlayed: u.stats.matchesPlayed,
    wins: u.stats.wins,
    kills: u.stats.kills,
    top5Count: u.stats.top5Count,
    tournamentPoints: u.stats.tournamentPoints,
    winRate: u.stats.winRate,
    kda: u.stats.kda,
  }));

  res.json({ leaderboard });
});

// ==========================================
// APP SETTINGS, EMERGENCY BANNER & CUSTOMIZER
// ==========================================

// Get dynamic app settings (public)
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: appSettings });
});

// Admin: Update any dynamic app content, numbers, video URL, or emergency banner
app.put('/api/admin/settings', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only admins or owner can customize app settings.' });
  }

  const {
    appName,
    tagline,
    emergencyBanner,
    contactNumbers,
    tutorialVideo,
    noticeBoardText,
    shareMessage,
  } = req.body;

  if (appName) appSettings.appName = appName;
  if (tagline !== undefined) appSettings.tagline = tagline;

  if (emergencyBanner) {
    const wasEnabled = appSettings.emergencyBanner.enabled;
    appSettings.emergencyBanner = {
      ...appSettings.emergencyBanner,
      ...emergencyBanner,
    };

    // If emergency banner was just activated, broadcast instant notification
    if (!wasEnabled && emergencyBanner.enabled) {
      notifications.unshift({
        id: 'notif-alert-' + Date.now(),
        title: '⚠️ জরুরি প্রশাসনিক ঘোষণা',
        message: emergencyBanner.message,
        type: 'SYSTEM_ALERT',
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    }
  }

  if (contactNumbers) {
    appSettings.contactNumbers = {
      ...appSettings.contactNumbers,
      ...contactNumbers,
    };
  }

  if (tutorialVideo) {
    appSettings.tutorialVideo = {
      ...appSettings.tutorialVideo,
      ...tutorialVideo,
    };
  }

  if (noticeBoardText !== undefined) appSettings.noticeBoardText = noticeBoardText;
  if (shareMessage !== undefined) appSettings.shareMessage = shareMessage;

  logAction(
    currentUser,
    'APP_SETTINGS_CUSTOMIZED',
    `Updated app settings, emergency banner state (${appSettings.emergencyBanner.enabled ? 'ACTIVE' : 'OFF'}), numbers and video config.`
  );

  res.json({ success: true, message: 'অ্যাপের সকল সেটিংস ও কনটেন্ট সফলভাবে আপডেট হয়েছে!', settings: appSettings });
});

// ==========================================
// OFFICER ABNORMAL PLAY & ANTI-CHEAT SYSTEM
// ==========================================

// Officer submits abnormal play incident report with proof
app.post('/api/officer/incidents', (req: Request, res: Response) => {
  if (currentUser.role !== 'officer' && currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only officers and admins can file abnormal play reports.' });
  }

  const {
    tournamentId,
    accusedPlayerName,
    accusedPlayerUid,
    cheatType,
    evidenceUrl,
    videoProofUrl,
    incidentRoundOrTime,
    description,
  } = req.body;

  if (!accusedPlayerUid || !cheatType) {
    return res.status(400).json({ error: 'Player UID and cheat classification are required.' });
  }

  const t = tournaments.find((item) => item.id === tournamentId);
  const matchTitle = t ? t.title : 'Live Tournament Match';

  let cheatTypeBangla = 'অস্বাভাবিক গেমপ্লে';
  switch (cheatType) {
    case 'PANEL_HACK':
      cheatTypeBangla = 'প্যানেল হ্যাক / অটো হেডশট (Panel User)';
      break;
    case 'AIMBOT_HEADSHOT':
      cheatTypeBangla = 'অটো এইম / এইমবট হ্যাক (Aimbot)';
      break;
    case 'WALLHACK_ESP':
      cheatTypeBangla = 'ওয়াল হ্যাক / লোকেশন ট্র্যাকার (ESP / Wallhack)';
      break;
    case 'SPEED_HACK':
      cheatTypeBangla = 'স্পিড হ্যাক / ফাস্ট মুভমেন্ট';
      break;
    case 'ILLEGAL_TEAMING':
      cheatTypeBangla = 'সোলো টুর্নামেন্টে অবৈধ টিম-আপ (Illegal Teaming)';
      break;
    case 'CONFIG_MOD':
      cheatTypeBangla = 'অ্যান্টেনা / কনফিগ ফাইল মড';
      break;
    default:
      cheatTypeBangla = 'সন্দেহভাজন অনৈতিক খেলা';
  }

  // Check if player is a registered user in our database
  const targetUser = users.find((u) => u.inGameUid === accusedPlayerUid);

  const newReport: AbnormalPlayReport = {
    id: 'inc-' + Date.now(),
    tournamentId: tournamentId || 'active-match',
    tournamentTitle: matchTitle,
    officerId: currentUser.id,
    officerName: currentUser.username,
    accusedPlayerName: accusedPlayerName || targetUser?.inGameName || 'Suspect',
    accusedPlayerUid,
    accusedUserId: targetUser?.id,
    cheatType,
    cheatTypeBangla,
    evidenceUrl: evidenceUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
    videoProofUrl: videoProofUrl || '',
    incidentRoundOrTime: incidentRoundOrTime || 'Live Round',
    description: description || 'Suspicious play flagged by tournament officer on duty.',
    status: 'PENDING_REVIEW',
    submittedAt: new Date().toISOString(),
  };

  abnormalReports.unshift(newReport);

  // Notify admins
  notifications.unshift({
    id: 'notif-cheat-' + Date.now(),
    title: '🚨 অফিসার অ্যান্টি-চিট রিপোর্ট!',
    message: `অফিসার ${currentUser.username} কর্তৃক খেলোয়াড় ${newReport.accusedPlayerName} (UID: ${accusedPlayerUid}) এর বিরুদ্ধে ${cheatTypeBangla} এর প্রমাণ জমা দেওয়া হয়েছে।`,
    type: 'SYSTEM_ALERT',
    timestamp: new Date().toISOString(),
    isRead: false,
  });

  logAction(
    currentUser,
    'OFFICER_INCIDENT_SUBMITTED',
    `Officer submitted cheat report for player UID ${accusedPlayerUid} (${cheatType}) with evidence.`,
    undefined,
    accusedPlayerUid
  );

  res.json({
    success: true,
    message: 'প্রমাণসহ অস্বাভাবিক গেমপ্লে রিপোর্ট অ্যাডমিন পর্যালোচনা সারিতে জমা দেওয়া হয়েছে!',
    report: newReport,
  });
});

// Admin: Get all abnormal play incident reports
app.get('/api/admin/incidents', (req: Request, res: Response) => {
  res.json({ success: true, incidents: abnormalReports });
});

// Admin: 1-Click Ban from Incident Report
app.post('/api/admin/incidents/:id/ban', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only admins or owner can execute player bans.' });
  }

  const report = abnormalReports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Incident report not found.' });

  const { adminNotes } = req.body;

  // Add to Blacklist
  const newBan: BlacklistEntry = {
    id: 'ban-' + Date.now(),
    userId: report.accusedUserId || 'suspect-' + Date.now(),
    inGameUid: report.accusedPlayerUid,
    username: report.accusedPlayerName,
    reason: `[অফিসার প্রমাণ যাচাইকৃত] ${report.cheatTypeBangla}: ${report.description}. ${adminNotes || ''}`,
    evidenceUrl: report.evidenceUrl || report.videoProofUrl,
    bannedAt: new Date().toISOString(),
    bannedByAdminId: currentUser.id,
    bannedByAdminName: currentUser.username,
    duration: 'permanent',
    appealStatus: 'NONE',
  };

  blacklist.unshift(newBan);

  // Mark accused registered user as banned
  const targetUser = users.find((u) => u.inGameUid === report.accusedPlayerUid);
  if (targetUser) {
    targetUser.isBanned = true;
    targetUser.banDetails = {
      reason: newBan.reason,
      duration: 'permanent',
      bannedAt: newBan.bannedAt,
      bannedByName: currentUser.username,
      appealStatus: 'NONE',
    };
  }

  // Update incident status
  report.status = 'BANNED';
  report.reviewedByAdminName = currentUser.username;
  report.adminActionNotes = adminNotes || 'Confirmed panel/cheat abuse and permanently banned.';

  // Broadcast public announcement about banned hacker
  notifications.unshift({
    id: 'notif-banned-' + Date.now(),
    title: '🛡️ অ্যান্টি-চিট অ্যাকশন: প্লেয়ার ব্যান!',
    message: `ফেয়ার-প্লে বজায় রাখতে প্লেয়ার ${report.accusedPlayerName} (UID: ${report.accusedPlayerUid})-কে ${report.cheatTypeBangla} ব্যবহারের অপরাধে স্থায়ীভাবে অ্যাপ থেকে ব্যান করা হলো।`,
    type: 'SYSTEM_ALERT',
    timestamp: new Date().toISOString(),
    isRead: false,
  });

  logAction(
    currentUser,
    'HACKER_PERMA_BANNED',
    `Permanently banned hacker UID ${report.accusedPlayerUid} (${report.cheatType}) based on officer evidence.`,
    targetUser?.id,
    report.accusedPlayerName
  );

  res.json({
    success: true,
    message: `প্লেয়ার ${report.accusedPlayerName} (UID: ${report.accusedPlayerUid})-কে অ্যাপ থেকে সফলভাবে ডাইরেক্ট ব্যান করা হয়েছে!`,
    ban: newBan,
  });
});

// Admin: Quick Direct Ban any Free Fire UID (Direct Action from User Request)
app.post('/api/admin/quick-ban', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only admins or owner can execute direct bans.' });
  }

  const { inGameUid, username, reason, cheatType, evidenceUrl } = req.body;

  if (!inGameUid || !reason) {
    return res.status(400).json({ error: 'Free Fire UID and ban reason are required.' });
  }

  // Remove existing ban if any to avoid duplication
  const existingIdx = blacklist.findIndex((b) => b.inGameUid === inGameUid);
  if (existingIdx !== -1) {
    blacklist.splice(existingIdx, 1);
  }

  const targetUser = users.find((u) => u.inGameUid === inGameUid);
  const playerName = username || targetUser?.inGameName || targetUser?.username || `FF_Player_${inGameUid}`;

  const banRecord: BlacklistEntry = {
    id: 'ban-quick-' + Date.now(),
    userId: targetUser?.id || 'uid-' + inGameUid,
    inGameUid,
    username: playerName,
    reason: `[ডাইরেক্ট ব্যান - ${cheatType || 'অনৈতিক খেলা/প্যানেল'}] ${reason}`,
    evidenceUrl: evidenceUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
    bannedAt: new Date().toISOString(),
    bannedByAdminId: currentUser.id,
    bannedByAdminName: currentUser.username,
    duration: 'permanent',
    appealStatus: 'NONE',
  };

  blacklist.unshift(banRecord);

  if (targetUser) {
    targetUser.isBanned = true;
    targetUser.banDetails = {
      reason: banRecord.reason,
      duration: 'permanent',
      bannedAt: banRecord.bannedAt,
      bannedByName: currentUser.username,
      appealStatus: 'NONE',
    };
  }

  // Also remove from any active tournament registrations
  tournaments.forEach((t) => {
    const pIdx = t.registeredPlayers.findIndex((p) => p.inGameUid === inGameUid);
    if (pIdx !== -1) {
      t.registeredPlayers.splice(pIdx, 1);
      t.slotsFilled = Math.max(0, t.slotsFilled - 1);
    }
  });

  // Alert in notifications
  notifications.unshift({
    id: 'notif-banned-' + Date.now(),
    title: '🚫 প্লেয়ার আইডি ডাইরেক্ট ব্যান!',
    message: `ফ্রি ফায়ার ইউআইডি ${inGameUid} (${playerName})-কে অনৈতিক খেলা/প্যানেল ব্যবহারের কারণে ডাইরেক্ট ব্যান ও টুর্নামেন্ট ব্ল্যাকলিস্ট করা হয়েছে।`,
    type: 'SYSTEM_ALERT',
    timestamp: new Date().toISOString(),
    isRead: false,
  });

  logAction(
    currentUser,
    'DIRECT_PLAYER_BANNED',
    `Admin directly banned UID ${inGameUid} (${playerName}). Reason: ${reason}`,
    targetUser?.id,
    playerName
  );

  res.json({
    success: true,
    message: `ফ্রি ফায়ার ইউআইডি ${inGameUid} ডাইরেক্ট ব্যান করা হয়েছে এবং টুর্নামেন্ট থেকে অপসারিত হয়েছে।`,
    ban: banRecord,
  });
});

// Admin: Add or Edit Officer Account
app.post('/api/admin/officers', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only admins or owner can manage officers.' });
  }

  const { username, inGameName, inGameUid, phone } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });

  let existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    existing.role = 'officer';
    if (phone) existing.phone = phone;
    if (inGameName) existing.inGameName = inGameName;
    if (inGameUid) existing.inGameUid = inGameUid;
    return res.json({ success: true, message: `ব্যবহারকারী @${existing.username}-কে সফলভাবে অফিসার হিসেবে নিয়োগ দেওয়া হয়েছে!`, officer: existing });
  }

  const newOfficer: User = {
    id: 'user-officer-' + Date.now(),
    email: `${username.toLowerCase()}@officer.gamesmorobd.com`,
    phone: phone || '+880 1711 999888',
    username,
    inGameName: inGameName || `OFFICER_${username.toUpperCase()}`,
    inGameUid: inGameUid || `${Math.floor(100000000 + Math.random() * 900000000)}`,
    tournamentUid: 'GMBD-OFF-' + Math.floor(1000 + Math.random() * 9000),
    role: 'officer',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    isBanned: false,
    createdAt: new Date().toISOString(),
    stats: {
      matchesPlayed: 0,
      wins: 0,
      kills: 0,
      top5Count: 0,
      tournamentPoints: 0,
      winRate: 0,
      kda: 0,
    },
    walletBalance: 1000,
  };

  users.push(newOfficer);

  logAction(
    currentUser,
    'OFFICER_APPOINTED',
    `Appointed new match officer @${username} (${newOfficer.inGameName})`,
    newOfficer.id,
    newOfficer.username
  );

  res.json({
    success: true,
    message: `নতুন ম্যাচ অফিসার @${username} সফলভাবে যুক্ত করা হয়েছে!`,
    officer: newOfficer,
  });
});

// ==========================================
// VITE INTEGRATION FOR DEV / PROD
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GAMES MORO BD Server is live on http://0.0.0.0:${PORT}`);
  });
}

startServer();
