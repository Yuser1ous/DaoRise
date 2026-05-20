var REALMS = [
  {
    name: '凡人',
    costs: [15, 36, 85, 190, 430, 960, 2100, 4600, 9800]
  },
  {
    name: '练气',
    costs: [6500, 14000, 30000, 65000, 140000, 300000, 640000, 1360000, 2900000]
  },
  {
    name: '筑基',
    costs: [420000, 900000, 1900000, 4000000, 8500000, 18000000, 38000000, 80000000, 168000000]
  },
  {
    name: '金丹',
    costs: [52000000, 110000000, 235000000, 500000000, 1060000000, 2250000000, 4800000000, 10200000000, 21600000000]
  },
  {
    name: '元婴',
    costs: [6500000000, 14000000000, 30000000000, 64000000000, 136000000000, 290000000000, 620000000000, 1320000000000, 2800000000000]
  },
  {
    name: '化神',
    costs: [820000000000, 1760000000000, 3760000000000, 8000000000000, 17000000000000, 36000000000000, 77000000000000, 164000000000000, 350000000000000]
  },
  {
    name: '合体',
    costs: [105000000000000, 225000000000000, 480000000000000, 1020000000000000, 2160000000000000, 4600000000000000, 9800000000000000, 20800000000000000, 44200000000000000]
  },
  {
    name: '渡劫',
    costs: [13500000000000000, 29000000000000000, 62000000000000000, 132000000000000000, 280000000000000000, 596000000000000000, 1270000000000000000, 2700000000000000000, 5750000000000000000]
  },
  {
    name: '大乘',
    costs: [1750000000000000000, 3750000000000000000, 8000000000000000000, 17000000000000000000, 36200000000000000000, 77000000000000000000, 164000000000000000000, 349000000000000000000, 742000000000000000000]
  },
  {
    name: '羽化',
    costs: [230000000000000000000, 492000000000000000000, 1050000000000000000000, 2230000000000000000000, 4740000000000000000000, 10100000000000000000000, 21500000000000000000000, 45700000000000000000000, 97200000000000000000000]
  },
  {
    name: '仙',
    costs: [30000000000000000000000, 64000000000000000000000, 136000000000000000000000, 290000000000000000000000, 617000000000000000000000, 1310000000000000000000000, 2790000000000000000000000, 5930000000000000000000000, 12600000000000000000000000]
  }
];

var CHINESE_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

var gameState = {
  realmIndex: 0,
  stageIndex: 0,
  currentPower: 0,
  aptitude: 1.0,
  spiritStones: 0,
  inventory: {},
  completedChallenges: [],
  achievements: {},
  stats: {
    exploreRuns: 0,
    encounters: 0,
    adventureChoices: 0,
    itemsUsed: 0
  },
  pendingEncounter: null,
  introSeen: false,
  demoCompleteSeen: false,
  skills: {
    duanti_shu: { owned: true, levelIndex: 0, currentXp: 0 },
    lianqi_jue: { owned: false, levelIndex: 0, currentXp: 0 },
    ningmai_shu: { owned: false, levelIndex: 0, currentXp: 0 },
    zhuji_xinfa: { owned: false, levelIndex: 0, currentXp: 0 }
  },
  equipment: {
    julingzhu: { owned: true, qualityIndex: 0 },
    xuantiejian: { owned: false, qualityIndex: 0 },
    lingxinyu: { owned: false, qualityIndex: 0 },
    shisha_xianglian: { owned: false, qualityIndex: 0 },
    ningmai_lingyu: { owned: false, qualityIndex: 0 },
    qingmingjian: { owned: false, qualityIndex: 0 },
    zhuji_lingyu: { owned: false, qualityIndex: 0 }
  }
};

var currentSlot = 0;
var autoSaveInterval = null;

var BALANCE = {
  battleStageBonus: 0.18,
  cultivateStageBonus: 0.14,
  skillXpBase: 10,
  skillXpRealmBonus: 7,
  skillXpStageBonus: 3,
  exploreRecoveryRate: 0.34,
  exploreTurnLimit: 80,
  challengeTurnLimit: 160,
  skillCultivateMs: 500,
  exploreStartDelayMs: 400,
  exploreStepDelayMs: 500,
  exploreTickMinMs: 1100,
  exploreTickMaxMs: 1700,
  exploreLogLimit: 90,
  cultivateTickMs: 1000
};

var baseGains = [1, 18, 320, 4800, 70000, 1000000, 14000000, 190000000, 2600000000, 35000000000, 470000000000];

var baseHPs = [64, 420, 2800, 22000, 175000, 1400000, 11200000, 90000000, 720000000, 5800000000, 46500000000];

var baseATKs = [6, 42, 280, 2200, 17500, 140000, 1120000, 9000000, 72000000, 580000000, 4650000000];

function getSkillMultiplier() {
  var bonus = 0;
  Object.keys(gameState.skills).forEach(function(id) {
    var s = gameState.skills[id];
    if (s.owned) {
      bonus += SKILLS[id].levels[s.levelIndex].bonus;
    }
  });
  return 1.0 + bonus;
}

function getBattleAptitudeMultiplier() {
  return Math.sqrt(Math.max(1, gameState.aptitude));
}

function getPlayerMaxHP() {
  return Math.floor(baseHPs[gameState.realmIndex] * (1 + gameState.stageIndex * BALANCE.battleStageBonus) * getBattleAptitudeMultiplier() * getSkillMultiplier() * getEquipBattleMultiplier());
}

function getPlayerATK() {
  return Math.floor(baseATKs[gameState.realmIndex] * (1 + gameState.stageIndex * BALANCE.battleStageBonus) * getBattleAptitudeMultiplier() * getSkillMultiplier() * getEquipBattleMultiplier());
}

var DUNGEONS = [
  {
    id: 'grassland',
    name: '草 原',
    desc: '广袤无垠的青草原野，偶有小草精出没，是最适合初学者的历练之地。',
    icon: '🌿',
    requireRealm: 0,
    requireStage: 0,
    monsters: [
      { name: '小草精(小)', hp: 12, atk: 1, stones: 5, drops: [{ id: 'lingli_dan_1', name: '一级灵力丹', count: 1, rate: 1.0 }] },
      { name: '小草精(中)', hp: 24, atk: 2, stones: 9, drops: [{ id: 'lingli_dan_1', name: '一级灵力丹', count: 1, rate: 1.0 }] },
      { name: '小草精(大)', hp: 42, atk: 4, stones: 16, drops: [{ id: 'lingli_dan_1', name: '一级灵力丹', count: 2, rate: 1.0 }] }
    ]
  },
  {
    id: 'forest_center',
    name: '森林中心',
    desc: '密林深处，古木参天。蛰伏的妖兽已通灵智，唯有强者方可踏足。',
    icon: '🌳',
    requireRealm: 0,
    requireStage: 4,
    monsters: [
      { name: '玄蛇', hp: 75, atk: 8, stones: 22, drops: [{ id: 'lingli_dan_2', name: '二级灵力丹', count: 1, rate: 1.0 }, { id: 'aptitude_dan_1', name: '劣等资质丹', count: 1, rate: 0.60 }] },
      { name: '瘴蟾', hp: 120, atk: 13, stones: 36, drops: [{ id: 'lingli_dan_2', name: '二级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_2', name: '低等资质丹', count: 1, rate: 0.32 }] },
      { name: '树妖', hp: 180, atk: 18, stones: 58, drops: [{ id: 'lingli_dan_2', name: '二级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_2', name: '低等资质丹', count: 1, rate: 0.40 }] }
    ]
  },
  {
    id: 'forest_forbidden',
    name: '森林禁地',
    desc: '森林最深处终年雾气不散，古树根须盘绕如阵。凡人后期修士若能穿过此地，便算真正触到了修行门槛。',
    icon: '🍃',
    requireRealm: 0,
    requireStage: 7,
    monsters: [
      { name: '雾隐狐', hp: 210, atk: 26, stones: 76, drops: [{ id: 'lingli_dan_2', name: '二级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_2', name: '低等资质丹', count: 1, rate: 0.45 }] },
      { name: '藤甲树卫', hp: 330, atk: 38, stones: 116, drops: [{ id: 'lingli_dan_2', name: '二级灵力丹', count: 3, rate: 1.0 }, { id: 'aptitude_dan_2', name: '低等资质丹', count: 2, rate: 0.38 }] },
      { name: '古木灵魈', hp: 520, atk: 56, stones: 180, drops: [{ id: 'lingli_dan_3', name: '三级灵力丹', count: 1, rate: 0.55 }, { id: 'aptitude_dan_3', name: '中等资质丹', count: 1, rate: 0.22 }] }
    ]
  },
  {
    id: 'cavern_outer',
    name: '幽邃地窟·外围',
    desc: '地底裂隙中涌动着幽暗灵气，蛰伏的妖兽吸食地脉精华，远非地面之兽可比。',
    icon: '🕳️',
    requireRealm: 1,
    requireStage: 0,
    monsters: [
      { name: '石甲虫', hp: 390, atk: 38, stones: 120, drops: [{ id: 'lingli_dan_3', name: '三级灵力丹', count: 1, rate: 1.0 }, { id: 'aptitude_dan_2', name: '低等资质丹', count: 1, rate: 0.55 }] },
      { name: '暗纹蟒', hp: 640, atk: 58, stones: 190, drops: [{ id: 'lingli_dan_3', name: '三级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_3', name: '中等资质丹', count: 1, rate: 0.34 }] },
      { name: '地穴蛛母', hp: 980, atk: 84, stones: 300, drops: [{ id: 'lingli_dan_3', name: '三级灵力丹', count: 3, rate: 1.0 }, { id: 'aptitude_dan_3', name: '中等资质丹', count: 1, rate: 0.42 }] }
    ]
  },
  {
    id: 'cavern_mid',
    name: '幽邃地窟·深处',
    desc: '穿过外层石脉后，地窟深处的灵气更为凝实。此处妖兽常年吞吐地脉之息，鳞甲与骨骼都被幽光浸染。',
    icon: '🪨',
    requireRealm: 1,
    requireStage: 2,
    monsters: [
      { name: '幽光岩蜥', hp: 960, atk: 115, stones: 260, drops: [{ id: 'lingli_dan_3', name: '三级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_3', name: '中等资质丹', count: 1, rate: 0.32 }] },
      { name: '裂骨蝎', hp: 1500, atk: 165, stones: 410, drops: [{ id: 'lingli_dan_3', name: '三级灵力丹', count: 3, rate: 1.0 }, { id: 'aptitude_dan_3', name: '中等资质丹', count: 1, rate: 0.38 }] },
      { name: '地脉蛮蜥', hp: 2300, atk: 240, stones: 640, drops: [{ id: 'lingli_dan_4', name: '四级灵力丹', count: 1, rate: 0.55 }, { id: 'aptitude_dan_3', name: '中等资质丹', count: 2, rate: 0.32 }] }
    ]
  },
  {
    id: 'cavern_center',
    name: '幽邃地窟·中心',
    desc: '深入窟心，幽暗灵气浓稠如水。地脉核心处孕育的妖兽已初具灵智，爪牙间流转着地心煞气，稍有不慎便是万劫不复。',
    icon: '🔥',
    requireRealm: 1,
    requireStage: 4,
    monsters: [
      { name: '熔岩甲虫', hp: 3000, atk: 430, stones: 820, drops: [{ id: 'lingli_dan_4', name: '四级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_4', name: '高等资质丹', count: 1, rate: 0.36 }] },
      { name: '地心炎蟒', hp: 4800, atk: 620, stones: 1280, drops: [{ id: 'lingli_dan_4', name: '四级灵力丹', count: 3, rate: 1.0 }, { id: 'aptitude_dan_4', name: '高等资质丹', count: 1, rate: 0.42 }] },
      { name: '煞晶蛛后', hp: 7600, atk: 900, stones: 2000, drops: [{ id: 'lingli_dan_4', name: '四级灵力丹', count: 4, rate: 1.0 }, { id: 'aptitude_dan_4', name: '高等资质丹', count: 2, rate: 0.36 }] }
    ]
  },
  {
    id: 'cavern_core',
    name: '幽邃地窟·核心',
    desc: '地窟尽头的地脉核心如心脏般跳动，煞气与灵气在此纠缠。能走到这里的练气修士，已是在为筑基前最后一劫磨砺根基。',
    icon: '🧿',
    requireRealm: 1,
    requireStage: 7,
    monsters: [
      { name: '煞纹岩傀', hp: 7000, atk: 1050, stones: 1600, drops: [{ id: 'lingli_dan_4', name: '四级灵力丹', count: 3, rate: 1.0 }, { id: 'aptitude_dan_4', name: '高等资质丹', count: 1, rate: 0.40 }] },
      { name: '地脉炎蛟', hp: 11000, atk: 1550, stones: 2500, drops: [{ id: 'lingli_dan_4', name: '四级灵力丹', count: 4, rate: 1.0 }, { id: 'aptitude_dan_4', name: '高等资质丹', count: 2, rate: 0.36 }] },
      { name: '幽煞晶王', hp: 17500, atk: 2250, stones: 3900, drops: [{ id: 'lingli_dan_5', name: '五级灵力丹', count: 1, rate: 0.45 }, { id: 'aptitude_dan_5', name: '极品资质丹', count: 1, rate: 0.16 }] }
    ]
  },
  {
    id: 'lingkuang',
    name: '灵矿山脉',
    desc: '筑基修士方可踏足的灵矿深处。山体之中嵌满散发微光的灵石矿脉，却也引来了吸食灵矿为生的妖兽——它们的鳞甲因矿质而异化，坚硬异常。',
    icon: '💎',
    requireRealm: 2,
    requireStage: 0,
    monsters: [
      { name: '晶甲蜥', hp: 11000, atk: 1250, stones: 1600, drops: [{ id: 'lingli_dan_5', name: '五级灵力丹', count: 1, rate: 1.0 }, { id: 'aptitude_dan_4', name: '高等资质丹', count: 2, rate: 0.44 }] },
      { name: '矿脉蟒', hp: 18000, atk: 1800, stones: 2500, drops: [{ id: 'lingli_dan_5', name: '五级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_5', name: '极品资质丹', count: 1, rate: 0.24 }] },
      { name: '钻山兽', hp: 30000, atk: 2600, stones: 4000, drops: [{ id: 'lingli_dan_5', name: '五级灵力丹', count: 3, rate: 1.0 }, { id: 'aptitude_dan_5', name: '极品资质丹', count: 1, rate: 0.28 }] }
    ]
  },
  {
    id: 'lingkuang_deep',
    name: '灵矿山脉·深层',
    desc: '灵矿深层的矿脉更加纯粹，石壁中流动着如血脉般的灵光。这里的妖兽吞食矿髓而生，肉身沉重，气息却越发凝练。',
    icon: '⛏️',
    requireRealm: 2,
    requireStage: 2,
    monsters: [
      { name: '矿髓甲虫', hp: 26000, atk: 3100, stones: 4200, drops: [{ id: 'lingli_dan_5', name: '五级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_5', name: '极品资质丹', count: 1, rate: 0.30 }] },
      { name: '晶背岩蟒', hp: 42000, atk: 4400, stones: 6500, drops: [{ id: 'lingli_dan_5', name: '五级灵力丹', count: 3, rate: 1.0 }, { id: 'aptitude_dan_5', name: '极品资质丹', count: 1, rate: 0.36 }] },
      { name: '吞矿巨兽', hp: 68000, atk: 6200, stones: 9800, drops: [{ id: 'lingli_dan_6', name: '六级灵力丹', count: 1, rate: 0.42 }, { id: 'aptitude_dan_5', name: '极品资质丹', count: 2, rate: 0.28 }] }
    ]
  },
  {
    id: 'shaqi_shenyuan',
    name: '煞气深渊',
    desc: '大地裂隙最深处的深渊。煞气化为实质，凝成黑雾弥漫四周。深渊中的妖兽常年被煞气淬炼，已非寻常筑基修士可敌——能从此处活着走出的，无一不是同辈翘楚。',
    icon: '🌑',
    requireRealm: 2,
    requireStage: 5,
    monsters: [
      { name: '煞气蝠妖', hp: 72000, atk: 10500, stones: 10500, drops: [{ id: 'lingli_dan_6', name: '六级灵力丹', count: 1, rate: 1.0 }, { id: 'aptitude_dan_5', name: '极品资质丹', count: 2, rate: 0.34 }] },
      { name: '深渊蠕虫', hp: 116000, atk: 15000, stones: 16000, drops: [{ id: 'lingli_dan_6', name: '六级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_6', name: '天品资质丹', count: 1, rate: 0.22 }] },
      { name: '煞晶古魔', hp: 190000, atk: 21500, stones: 24500, drops: [{ id: 'lingli_dan_6', name: '六级灵力丹', count: 3, rate: 1.0 }, { id: 'aptitude_dan_6', name: '天品资质丹', count: 1, rate: 0.26 }] }
    ]
  },
  {
    id: 'shaqi_shenyuan_core',
    name: '煞气深渊·核心',
    desc: '深渊核心处煞气几乎凝成晶壁，灵识稍有松懈便会被杂念撕扯。此地是筑基后期修士压榨根基、磨砺金丹雏形的险地。',
    icon: '🕯️',
    requireRealm: 2,
    requireStage: 7,
    monsters: [
      { name: '黑雾煞灵', hp: 170000, atk: 26000, stones: 28000, drops: [{ id: 'lingli_dan_6', name: '六级灵力丹', count: 2, rate: 1.0 }, { id: 'aptitude_dan_6', name: '天品资质丹', count: 1, rate: 0.28 }] },
      { name: '裂魂古魔', hp: 280000, atk: 38000, stones: 43000, drops: [{ id: 'lingli_dan_6', name: '六级灵力丹', count: 4, rate: 1.0 }, { id: 'aptitude_dan_6', name: '天品资质丹', count: 1, rate: 0.34 }] },
      { name: '煞渊魔主', hp: 460000, atk: 56000, stones: 66000, drops: [{ id: 'lingli_dan_6', name: '六级灵力丹', count: 5, rate: 1.0 }, { id: 'aptitude_dan_6', name: '天品资质丹', count: 2, rate: 0.30 }] }
    ]
  }
];

var ITEMS = {
  lingli_dan_1: { name: '一级灵力丹', icon: '💊', effect: '使用后获得 22 点灵力', type: 'power', value: 22 },
  lingli_dan_2: { name: '二级灵力丹', icon: '💊', effect: '使用后获得 160 点灵力', type: 'power', value: 160 },
  lingli_dan_3: { name: '三级灵力丹', icon: '💊', effect: '使用后获得 1100 点灵力', type: 'power', value: 1100 },
  lingli_dan_4: { name: '四级灵力丹', icon: '💊', effect: '使用后获得 7200 点灵力', type: 'power', value: 7200 },
  lingli_dan_5: { name: '五级灵力丹', icon: '💊', effect: '使用后获得 46000 点灵力', type: 'power', value: 46000 },
  lingli_dan_6: { name: '六级灵力丹', icon: '💊', effect: '使用后获得 290000 点灵力', type: 'power', value: 290000 },
  aptitude_dan_1: { name: '劣等资质丹', icon: '💠', effect: '使用后资质 +0.03', type: 'aptitude', value: 0.03 },
  aptitude_dan_2: { name: '低等资质丹', icon: '💠', effect: '使用后资质 +0.07', type: 'aptitude', value: 0.07 },
  aptitude_dan_3: { name: '中等资质丹', icon: '💠', effect: '使用后资质 +0.13', type: 'aptitude', value: 0.13 },
  aptitude_dan_4: { name: '高等资质丹', icon: '💠', effect: '使用后资质 +0.23', type: 'aptitude', value: 0.23 },
  aptitude_dan_5: { name: '极品资质丹', icon: '💠', effect: '使用后资质 +0.38', type: 'aptitude', value: 0.38 },
  aptitude_dan_6: { name: '天品资质丹', icon: '💠', effect: '使用后资质 +0.60', type: 'aptitude', value: 0.60 }
};

var CHALLENGES = [
  {
    id: 'challenge_1',
    name: '挑战一：森林试炼',
    desc: '森林外围妖气弥漫，一头修炼百年的虎妖盘踞于此。它曾是一方山君，因吞食了沾染灵气的异果而开了灵智。如今以人为食，已成了这片森林最大的祸患。\n\n猎户不敢靠近，采药人绕道而行。是时候拔剑了——让这畜生知道，妖终究只是妖。',
    icon: '🐅',
    requireRealm: 0,
    requireStage: 3,
    monster: { name: '虎妖王', hp: 90, atk: 10 },
    rewardAptitude: 0.22,
    rewardEquip: 'xuantiejian',
    winMsg: '虎妖王轰然倒下，妖气四散。在它巢穴深处，你发现了一柄插在石中的古剑——玄铁剑。剑身虽暗，却透着凛凛寒光。你握住剑柄的瞬间，仿佛听到一声低沉的剑鸣。从此以后，你不再手无寸铁。',
    loseMsg: '虎妖王一掌将你拍飞——它的力量远超你的预料。回山修炼，待你修为精进，再来斩妖除害！'
  },
  {
    id: 'challenge_2',
    name: '挑战二：踏上修行路',
    desc: '修行之路从问心开始。面对内心的疑惑与恐惧，你能否坚定信念？',
    icon: '⚡',
    requireRealm: 0,
    requireStage: 8,
    monster: { name: '问心石', hp: 280, atk: 26 },
    rewardAptitude: 0.55,
    rewardSkill: 'lianqi_jue',
    rewardEquip: 'lingxinyu',
    winMsg: '我看到了你的决心！修仙的道路为你敞开……问心石碎开的瞬间，一块温润的灵玉从中浮现——灵心玉。它静静地躺在你掌心，温暖如心火。你将带着这份信念与力量，走向更广阔的天地。',
    loseMsg: '你的决心还不够坚定……回去修炼心境，待到心志如铁，再来一试。'
  },
  {
    id: 'challenge_3',
    name: '挑战三：时之狭间',
    desc: '练气四阶，灵力初成。一日打坐之时，忽然天地失色，万物凝滞——一道时空裂隙在身侧绽开。裂隙彼端，竟是一片被时光遗忘的虚空，无数岁月的残片在其中漂浮、湮灭。一位面容模糊的身影立于裂隙尽头，周身环绕着流沙般的星光。\n\n它不言不语，只是缓缓抬手。你明白了——这是上古修士布下的试炼。唯有在时光洪流中站稳脚跟者，才有资格触碰那枚凝结了亘古岁月的时砂。',
    icon: '⏳',
    requireRealm: 1,
    requireStage: 3,
    monster: { name: '时之残像', hp: 1800, atk: 180 },
    rewardAptitude: 1.0,
    rewardEquip: 'shisha_xianglian',
    winMsg: '残像在最后一击下消散为漫天星砂。裂隙开始闭合，但那些星砂没有散尽——它们汇聚到一起，在你颈间凝成了一条项链。每一粒砂砾都封存着一瞬永恒。你感到周身时光流速悄然改变，攻守间皆有岁月之力加持。',
    loseMsg: '时光洪流将你冲退。残像依旧伫立在裂隙中，仿佛一场永远不会醒来的梦。继续修炼，待你更强之时，再来叩问时间之门。'
  },
  {
    id: 'challenge_4',
    name: '挑战四：经脉贯通',
    desc: '练气巅峰，只差一步便可筑基。然而这一步之遥，却是无数修士终生无法跨越的天堑。\n\n你盘膝而坐，内视周身经脉——三百六十处大穴，无数细小脉络，如同一张残破的星图。你需要以灵力为针，以意志为线，将这张残图一一补全。每贯通一处，便有剧痛袭来，仿佛筋骨被生生撕裂。\n\n但修仙之路，哪一步不是逆天而行？咬紧牙关，坚持下去。',
    icon: '✨',
    requireRealm: 1,
    requireStage: 8,
    monster: { name: '经脉壁垒', hp: 7200, atk: 680 },
    rewardAptitude: 1.8,
    rewardSkill: 'ningmai_shu',
    rewardEquip: 'ningmai_lingyu',
    winMsg: '最后一处穴位贯通！全身经脉在同一瞬间共鸣——你感到一股前所未有的力量从丹田喷涌而出，流转周身。经脉贯通时凝结的灵力在胸口汇聚，化作一枚晶莹剔透的宝玉——凝脉灵玉。从此，你掌握了凝脉术，灵力贯通全身经脉，筑基之路已在眼前。',
    loseMsg: '经脉剧痛让你不得不停下。打通经脉非一朝一夕之功，回去继续修炼，让灵力更加充沛，再来冲击这最后的壁垒。'
  },
  {
    id: 'challenge_5',
    name: '挑战五：剑冢问道',
    desc: '筑基四阶，你感应到一处古老的剑冢召唤。踏入其中，万剑齐鸣——这是上古剑修以毕生剑意布下的试剑大阵。\n\n阵中一柄青冥长剑悬浮半空，剑身震颤不止。剑灵化形而出，它要考验来者是否有资格执掌此剑。唯有以剑心对剑心，以杀意破杀意，方能得剑认主。',
    icon: '🗡️',
    requireRealm: 2,
    requireStage: 3,
    monster: { name: '剑灵', hp: 52000, atk: 4300 },
    rewardAptitude: 3.2,
    rewardEquip: 'qingmingjian',
    winMsg: '剑灵散作漫天青光，重新凝聚于剑身之中。青冥剑发出一声清越长鸣，自行飞入你手中。剑柄微凉，却与你掌心脉动合而为一。自此，你不再是寻常修士——你是一名剑修。',
    loseMsg: '剑阵威压如山，剑意如潮水般将你逼退。你尚未领悟剑心真谛——回山修行，待剑意初成，再来取剑。'
  },
  {
    id: 'challenge_6',
    name: '挑战六：筑基天劫',
    desc: '筑基九阶，圆满在即。天穹骤暗，乌云汇成龙卷之势——这是天道对筑基圆满修士的最后一关。\n\n天劫之雷并非为毁灭而来，而是为淬炼。能够在雷劫中活下来的修士，丹田将被天雷重塑，化为真正的仙道根基。但这雷电之中，也藏着一道上古修士留下的印记——若能撑过，便能领悟筑基心法，从此超凡脱俗。',
    icon: '🌩️',
    requireRealm: 2,
    requireStage: 8,
    monster: { name: '天劫雷云', hp: 190000, atk: 16500 },
    rewardAptitude: 5.5,
    rewardSkill: 'zhuji_xinfa',
    rewardEquip: 'zhuji_lingyu',
    winMsg: '最后一道天雷落下，你不再躲避——而是迎雷而上！雷劫之力灌入丹田，将你的灵根彻底淬炼。乌云散去，一枚紫光流转的灵玉在你掌心凝结——筑基灵玉，这是天道对渡过天劫者的馈赠。你已领悟筑基心法，丹田化鼎炉，从此踏入真正的仙道之途。',
    loseMsg: '天雷之威远超想象。你被劈得浑身焦黑，灵脉受损。但天道仁慈，允许失败者重来。回去养好伤势，待修为更加稳固，再来渡此天劫。'
  }
];

var SKILLS = {
  duanti_shu: {
    name: '锻体术',
    desc: '淬炼筋骨，强化体魄。以灵气冲击经脉，令肉身坚如金石。',
    icon: '📜',
    levels: [
      { name: '入门', bonus: 0.08, xp: 80 },
      { name: '熟练', bonus: 0.20, xp: 220 },
      { name: '小成', bonus: 0.38, xp: 560 },
      { name: '大成', bonus: 0.62, xp: 1300 },
      { name: '圆满', bonus: 0.95, xp: null }
    ]
  },
  lianqi_jue: {
    name: '炼气诀',
    desc: '引导天地灵气化为己用，是踏入练气境界的钥匙。',
    icon: '🌀',
    levels: [
      { name: '入门', bonus: 0.16, xp: 180 },
      { name: '熟练', bonus: 0.40, xp: 520 },
      { name: '小成', bonus: 0.78, xp: 1300 },
      { name: '大成', bonus: 1.32, xp: 3000 },
      { name: '圆满', bonus: 2.15, xp: null }
    ]
  },
  ningmai_shu: {
    name: '凝脉术',
    desc: '以灵为针、以气为线，将全身经脉一一贯通。经脉既通，法力自生，是踏入筑基境界的必经之途。',
    icon: '✨',
    levels: [
      { name: '入门', bonus: 0.34, xp: 420 },
      { name: '熟练', bonus: 0.78, xp: 1150 },
      { name: '小成', bonus: 1.48, xp: 2900 },
      { name: '大成', bonus: 2.55, xp: 6800 },
      { name: '圆满', bonus: 4.10, xp: null }
    ]
  },
  zhuji_xinfa: {
    name: '筑基心法',
    desc: '筑仙基以立天地，凝丹田而纳乾坤。筑基修士必须掌握的根基心法，丹田如鼎炉，灵力在其中淬炼提纯，威力倍增。',
    icon: '🔥',
    levels: [
      { name: '入门', bonus: 0.70, xp: 950 },
      { name: '熟练', bonus: 1.55, xp: 2600 },
      { name: '小成', bonus: 2.95, xp: 6500 },
      { name: '大成', bonus: 5.10, xp: 15000 },
      { name: '圆满', bonus: 8.20, xp: null }
    ]
  }
};

var EQUIP_QUALITIES = [
  { name: '凡品', color: '#aaa', multiplier: 1.0 },
  { name: '灵品', color: '#7eb8da', multiplier: 1.35 },
  { name: '真品', color: '#c9a96e', multiplier: 1.9 },
  { name: '极品', color: '#ffd700', multiplier: 2.65 }
];

var EQUIPMENT = {
  julingzhu: {
    name: '聚灵珠',
    icon: '🔮',
    desc: '凝聚天地灵气，加快修炼速度。灵力如泉涌，修为日进千里。',
    type: 'cultivate_speed',
    baseEffect: 0.12,
    upgradeCosts: [55, 220, 760]
  },
  xuantiejian: {
    name: '玄铁剑',
    icon: '⚔️',
    desc: '以千年玄铁锻造而成。剑身暗沉无光，入手却沉重异常。一剑斩出，虎啸龙吟。',
    type: 'attack_hp',
    baseEffect: 0.12,
    upgradeCosts: [85, 320, 1050]
  },
  lingxinyu: {
    name: '灵心玉',
    icon: '💠',
    desc: '一块温润通透的灵玉，贴身佩戴可宁心静气，吸纳天地灵气的速度倍增。据说是上古修士坐化时以毕生修为凝结而成。',
    type: 'cultivate_speed',
    baseEffect: 0.15,
    upgradeCosts: [380, 1250, 3900]
  },
  shisha_xianglian: {
    name: '时砂项链',
    icon: '⏳',
    desc: '以时间之砂凝铸而成。佩戴者周身时光流速异于常人，攻守之间皆有岁月之力加持。',
    type: 'attack_hp',
    baseEffect: 0.14,
    upgradeCosts: [750, 2400, 7600]
  },
  ningmai_lingyu: {
    name: '凝脉灵玉',
    icon: '💎',
    desc: '经脉贯通之际，灵力凝结而成的宝玉。蕴含经脉共鸣之力，修炼时周身灵气如潮水般涌入丹田。',
    type: 'cultivate_speed',
    baseEffect: 0.18,
    upgradeCosts: [1600, 5200, 16500]
  },
  qingmingjian: {
    name: '青冥剑',
    icon: '🗡️',
    desc: '剑身薄如蝉翼，通体泛青冥之光。据传以天外陨铁混合万年寒玉锻造而成，剑出如青冥裂空，筑基修士持之可越阶而战。',
    type: 'attack_hp',
    baseEffect: 0.16,
    upgradeCosts: [3600, 11500, 38000]
  },
  zhuji_lingyu: {
    name: '筑基灵玉',
    icon: '🟣',
    desc: '筑基大成时以丹田真元凝聚的灵玉，蕴含筑基修士毕生精华。佩戴于身，天地灵气如江河汇海般涌入丹田，修炼速度远超寻常。',
    type: 'cultivate_speed',
    baseEffect: 0.21,
    upgradeCosts: [7000, 23000, 76000]
  }
};

var ACHIEVEMENTS = [
  { id: 'intro_path', name: '初入仙途', desc: '完成开场剧情，真正踏上修行路。', target: 'intro', value: 1, reward: { stones: 40 } },
  { id: 'first_cultivation', name: '第一次修炼', desc: '灵力达到第一次突破需求。', target: 'firstPower', value: REALMS[0].costs[0], reward: { items: [{ id: 'lingli_dan_1', count: 1 }] } },
  { id: 'mortal_stage_3', name: '小有所成', desc: '突破到凡人三阶。', target: 'realmStage', realm: 0, stage: 2, reward: { items: [{ id: 'aptitude_dan_1', count: 1 }] } },
  { id: 'first_explore', name: '初探秘境', desc: '完成一次游历，并至少击败 1 只妖兽。', target: 'stat', stat: 'exploreRuns', value: 1, reward: { stones: 90 } },
  { id: 'first_encounter', name: '奇遇初见', desc: '触发 1 次奇遇。', target: 'stat', stat: 'encounters', value: 1, reward: { power: 220 } },
  { id: 'risk_for_dao', name: '险中求道', desc: '选择 1 次冒险奇遇选项。', target: 'stat', stat: 'adventureChoices', value: 1, reward: { aptitude: 0.06 } },
  { id: 'pills_taken', name: '丹药入腹', desc: '累计使用 3 枚丹药。', target: 'stat', stat: 'itemsUsed', value: 3, reward: { stones: 140 } },
  { id: 'skill_familiar', name: '功法精进', desc: '任意功法达到熟练。', target: 'skillLevel', value: 1, reward: { skillXp: 100 } },
  { id: 'tiger_slayer', name: '剑斩虎妖', desc: '完成挑战一：森林试炼。', target: 'challenge', challenge: 'challenge_1', reward: { stones: 160 } },
  { id: 'enter_qi', name: '踏入练气', desc: '突破到练气境。', target: 'realm', value: 1, reward: { items: [{ id: 'lingli_dan_2', count: 1 }] } },
  { id: 'brave_heart', name: '问心无惧', desc: '完成挑战二：踏上修行路。', target: 'challenge', challenge: 'challenge_2', reward: { aptitude: 0.22 } },
  { id: 'demo_path', name: 'Demo 登仙路', desc: '达到金丹，完成当前 Demo 主线。', target: 'realm', value: 3, reward: { stones: 1000 } }
];

var ENCOUNTERS = [
  {
    id: 'spring',
    name: '灵泉一脉',
    desc: '石壁裂开一道细泉，灵气清冽，却隐隐带着冲脉之力。',
    options: [
      { id: 'safe', label: '引泉疗伤', tone: '稳妥', desc: '恢复血量，并获得少量灵力。' },
      { id: 'risk', label: '强行吸收', tone: '冒险', desc: '获得更多灵力，但会损伤气血。' },
      { id: 'rest', label: '静坐调息', tone: '离开', desc: '不取灵泉，只恢复更多血量。' }
    ]
  },
  {
    id: 'herb',
    name: '古藤药香',
    desc: '古藤缠绕的岩缝里露出药香，似有丹药被灵气温养多年。',
    options: [
      { id: 'safe', label: '谨慎采药', tone: '稳妥', desc: '获得 1 枚当前品阶丹药。' },
      { id: 'risk', label: '深入采摘', tone: '冒险', desc: '有概率额外获得 1 枚丹药。' },
      { id: 'rest', label: '折枝离去', tone: '离开', desc: '放弃主药，恢复少量血量。' }
    ]
  },
  {
    id: 'stele',
    name: '残碑剑痕',
    desc: '半截古碑横卧草间，碑上剑痕仍有未散道韵。',
    options: [
      { id: 'safe', label: '观痕悟法', tone: '稳妥', desc: '获得功法修为。' },
      { id: 'risk', label: '以神入碑', tone: '冒险', desc: '获得更多功法修为，但会损血。' },
      { id: 'rest', label: '拓印残痕', tone: '离开', desc: '获得少量资质。' }
    ]
  },
  {
    id: 'lair',
    name: '妖兽巢穴',
    desc: '你发现一处新鲜巢穴，里面有灵石气息，也有压低的喘息声。',
    options: [
      { id: 'safe', label: '绕路离开', tone: '稳妥', desc: '避开危险，恢复少量血量。' },
      { id: 'risk', label: '潜入偷取', tone: '冒险', desc: '获得灵石，但可能惊动妖兽受伤。' },
      { id: 'fight', label: '主动挑战', tone: '战斗', desc: '立刻挑战一只额外妖兽。' }
    ]
  }
];

function getEquipCultivateMultiplier() {
  var multi = 1.0;
  Object.keys(gameState.equipment).forEach(function(id) {
    var eq = gameState.equipment[id];
    if (!eq || !eq.owned) return;
    var def = EQUIPMENT[id];
    if (!def || def.type !== 'cultivate_speed') return;
    var qual = EQUIP_QUALITIES[eq.qualityIndex];
    multi *= (1.0 + def.baseEffect * qual.multiplier);
  });
  return multi;
}

function getEquipBattleMultiplier() {
  var multi = 1.0;
  Object.keys(gameState.equipment).forEach(function(id) {
    var eq = gameState.equipment[id];
    if (!eq || !eq.owned) return;
    var def = EQUIPMENT[id];
    if (!def || def.type !== 'attack_hp') return;
    var qual = EQUIP_QUALITIES[eq.qualityIndex];
    multi *= (1.0 + def.baseEffect * qual.multiplier);
  });
  return multi;
}

function getGainPerSec() {
  return Math.floor(baseGains[gameState.realmIndex] * (1 + gameState.stageIndex * BALANCE.cultivateStageBonus) * gameState.aptitude * getSkillMultiplier() * getEquipCultivateMultiplier());
}

var cultivateInterval = null;

function getSkillXpPerClick() {
  return Math.floor((BALANCE.skillXpBase + gameState.realmIndex * BALANCE.skillXpRealmBonus + gameState.stageIndex * BALANCE.skillXpStageBonus) * Math.sqrt(Math.max(1, gameState.aptitude)));
}

var TRIBULATION_REQUIREMENTS = [
  { skill: 'lianqi_jue', message: '需获得炼气诀方可渡劫！前往挑战获取。' },
  { skill: 'ningmai_shu', message: '需获得凝脉术方可渡劫！前往挑战获取。' },
  { skill: 'zhuji_xinfa', message: '需获得筑基心法方可渡劫！前往挑战获取。' }
];

var SKILL_LEVEL_REQUIREMENTS = {
  duanti_shu: [
    null,
    null,
    { realm: 0, stage: 3 },
    { realm: 0, stage: 6 },
    { realm: 0, stage: 8 }
  ],
  lianqi_jue: [
    null,
    { realm: 1, stage: 0 },
    { realm: 1, stage: 2 },
    { realm: 1, stage: 5 },
    { realm: 1, stage: 8 }
  ],
  ningmai_shu: [
    null,
    { realm: 2, stage: 0 },
    { realm: 2, stage: 2 },
    { realm: 2, stage: 5 },
    { realm: 2, stage: 8 }
  ],
  zhuji_xinfa: [
    null,
    { realm: 3, stage: 0 },
    { realm: 3, stage: 2 },
    { realm: 3, stage: 5 },
    { realm: 3, stage: 8 }
  ]
};

function meetsRealmStage(realmIdx, stageIdx) {
  if (gameState.realmIndex > realmIdx) return true;
  return gameState.realmIndex === realmIdx && gameState.stageIndex >= stageIdx;
}

function getSkillLevelRequirement(skillId, levelIndex) {
  var reqs = SKILL_LEVEL_REQUIREMENTS[skillId];
  return reqs ? reqs[levelIndex] : null;
}

function getSkillLevelLockText(skillId) {
  var ss = gameState.skills[skillId];
  if (!ss) return '';
  var targetLevel = ss.levelIndex + 1;
  var req = getSkillLevelRequirement(skillId, targetLevel);
  if (!req || meetsRealmStage(req.realm, req.stage)) return '';
  return '需达到 ' + requireToText(req.realm, req.stage) + ' 后继续修炼';
}

function isFinalRealm() {
  return gameState.realmIndex >= REALMS.length - 1;
}

function needsTribulation() {
  return !isFinalRealm() && gameState.stageIndex === 8;
}

function getTribulationRequirement() {
  return TRIBULATION_REQUIREMENTS[gameState.realmIndex] || null;
}

function fmtNum(n) {
  if (!isFinite(n)) return '∞';
  if (n < 10000) return '' + Math.floor(n);
  var units = ['', '万', '亿', '兆', '京', '垓', '秭', '穰'];
  var unitIndex = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(10000)));
  var value = n / Math.pow(10000, unitIndex);
  return value.toFixed(value >= 100 || value % 1 === 0 ? 0 : 1) + units[unitIndex];
}

function getDefaultStats() {
  return {
    exploreRuns: 0,
    encounters: 0,
    adventureChoices: 0,
    itemsUsed: 0
  };
}

function ensureGameStateShape() {
  if (!gameState.achievements) gameState.achievements = {};
  if (!gameState.stats) gameState.stats = {};
  var defaults = getDefaultStats();
  Object.keys(defaults).forEach(function(key) {
    if (gameState.stats[key] == null) gameState.stats[key] = defaults[key];
  });
  if (!('pendingEncounter' in gameState)) gameState.pendingEncounter = null;
  ACHIEVEMENTS.forEach(function(a) {
    if (!gameState.achievements[a.id]) {
      gameState.achievements[a.id] = { completed: false, claimed: false };
    } else {
      gameState.achievements[a.id].completed = gameState.achievements[a.id].completed === true;
      gameState.achievements[a.id].claimed = gameState.achievements[a.id].claimed === true;
    }
  });
}

function getAchievementProgress(a) {
  if (a.target === 'intro') return gameState.introSeen ? 1 : 0;
  if (a.target === 'firstPower') {
    return meetsRealmStage(0, 1) ? a.value : Math.min(a.value, gameState.currentPower);
  }
  if (a.target === 'realmStage') return meetsRealmStage(a.realm, a.stage) ? 1 : 0;
  if (a.target === 'stat') return gameState.stats[a.stat] || 0;
  if (a.target === 'skillLevel') {
    var best = 0;
    Object.keys(gameState.skills).forEach(function(id) {
      var s = gameState.skills[id];
      if (s && s.owned) best = Math.max(best, s.levelIndex || 0);
    });
    return best;
  }
  if (a.target === 'challenge') return isChallengeCompleted(a.challenge) ? 1 : 0;
  if (a.target === 'realm') return gameState.realmIndex;
  return 0;
}

function getAchievementGoal(a) {
  if (a.target === 'intro' || a.target === 'realmStage' || a.target === 'challenge') return 1;
  return a.value || 1;
}

function isAchievementComplete(a) {
  return getAchievementProgress(a) >= getAchievementGoal(a);
}

function describeReward(reward) {
  var parts = [];
  if (!reward) return '无';
  if (reward.stones) parts.push('灵石×' + fmtNum(reward.stones));
  if (reward.power) parts.push('灵力+' + fmtNum(reward.power));
  if (reward.aptitude) parts.push('资质+' + reward.aptitude.toFixed(2));
  if (reward.skillXp) parts.push('功法XP+' + fmtNum(reward.skillXp));
  if (reward.items) {
    reward.items.forEach(function(r) {
      var item = ITEMS[r.id];
      if (item) parts.push(item.name + '×' + r.count);
    });
  }
  return parts.join('，');
}

function grantRewardSkillXp(amount) {
  var remaining = amount;
  Object.keys(gameState.skills).some(function(id) {
    var s = gameState.skills[id];
    var def = SKILLS[id];
    if (!s || !s.owned || !def || s.levelIndex >= def.levels.length - 1) return false;
    s.currentXp += remaining;
    while (s.levelIndex < def.levels.length - 1) {
      var needXp = def.levels[s.levelIndex].xp;
      if (needXp == null || s.currentXp < needXp) break;
      var nextLevel = s.levelIndex + 1;
      var req = getSkillLevelRequirement(id, nextLevel);
      if (req && !meetsRealmStage(req.realm, req.stage)) {
        s.currentXp = needXp;
        break;
      }
      s.currentXp -= needXp;
      s.levelIndex++;
    }
    return true;
  });
}

function applyAchievementReward(reward) {
  if (!reward) return;
  if (reward.stones) gameState.spiritStones += reward.stones;
  if (reward.power) gameState.currentPower += reward.power;
  if (reward.aptitude) gameState.aptitude += reward.aptitude;
  if (reward.skillXp) grantRewardSkillXp(reward.skillXp);
  if (reward.items) {
    reward.items.forEach(function(r) {
      var item = ITEMS[r.id];
      if (item) addToInventory(r.id, item.name, r.count);
    });
  }
}

function checkAchievements(silent) {
  ensureGameStateShape();
  var changed = false;
  ACHIEVEMENTS.forEach(function(a) {
    var state = gameState.achievements[a.id];
    if (!state.completed && isAchievementComplete(a)) {
      state.completed = true;
      changed = true;
      if (!silent) showToast('成就达成：' + a.name);
    }
  });
  if (changed) {
    buildAchievementTab();
    persistCurrentSlot();
  }
}

function trackStat(type, amount) {
  ensureGameStateShape();
  gameState.stats[type] = (gameState.stats[type] || 0) + (amount || 1);
  checkAchievements(false);
}

function claimAchievement(id) {
  ensureGameStateShape();
  var a = ACHIEVEMENTS.find(function(item) { return item.id === id; });
  if (!a) return;
  var state = gameState.achievements[id];
  if (!state.completed || state.claimed) return;
  state.claimed = true;
  applyAchievementReward(a.reward);
  showToast('领取成就奖励：' + describeReward(a.reward));
  updateRealmDisplay();
  updateCultivateTab();
  buildAlchemyTab();
  buildSkillTab();
  buildEquipTab();
  buildAchievementTab();
  checkAchievements(true);
  persistCurrentSlot();
}

function buildAchievementTab() {
  var container = document.getElementById('achievement-container');
  if (!container) return;
  ensureGameStateShape();
  var html = '<div class="achievement-summary">成就会引导你体验 Demo 主线，奖励用于加快前 45 分钟节奏。</div>';
  ACHIEVEMENTS.forEach(function(a) {
    var state = gameState.achievements[a.id];
    var progress = Math.min(getAchievementProgress(a), getAchievementGoal(a));
    var goal = getAchievementGoal(a);
    var pct = Math.min(100, Math.floor(progress / goal * 100));
    var status = state.claimed ? '已领取' : (state.completed ? '可领取' : '进行中');
    html += '<div class="achievement-card ' + (state.completed ? 'complete' : '') + '">';
    html += '<div class="achievement-main">';
    html += '<div class="achievement-title-row"><span class="achievement-title">' + a.name + '</span><span class="achievement-status">' + status + '</span></div>';
    html += '<div class="achievement-desc">' + a.desc + '</div>';
    html += '<div class="achievement-reward">奖励：' + describeReward(a.reward) + '</div>';
    html += '<div class="achievement-progress"><div class="achievement-progress-bar" style="width:' + pct + '%"></div></div>';
    html += '<div class="achievement-count">' + fmtNum(progress) + ' / ' + fmtNum(goal) + '</div>';
    html += '</div>';
    html += '<button class="btn-achievement-claim" onclick="claimAchievement(\'' + a.id + '\')"' + (!state.completed || state.claimed ? ' disabled' : '') + '>领 取</button>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function updateRealmDisplay() {
  var realm = REALMS[gameState.realmIndex];
  var stage = gameState.stageIndex;
  var required = realm.costs[stage];
  var current = gameState.currentPower;
  var pct = Math.min(100, Math.floor(current / required * 100));

  document.getElementById('realm-text').textContent = '境界：' + realm.name + ' · ' + CHINESE_NUM[stage + 1] + '阶';
  document.getElementById('progress-label').textContent = '当前灵力值 ' + fmtNum(current) + ' / 升级所需 ' + fmtNum(required);
  document.getElementById('progress-bar-inner').style.width = pct + '%';
  document.getElementById('stat-atk').textContent = fmtNum(getPlayerATK());
  document.getElementById('stat-hp').textContent = fmtNum(getPlayerMaxHP());
  document.getElementById('stat-stones').textContent = fmtNum(gameState.spiritStones);

  var tribBtn = document.getElementById('btn-tribulation');
  if (needsTribulation()) {
    tribBtn.style.display = '';
    tribBtn.textContent = '渡 劫';
  } else {
    tribBtn.style.display = 'none';
  }
}

function cultivateTick() {
  gameState.currentPower += getGainPerSec();
  var realm = REALMS[gameState.realmIndex];
  var required = realm.costs[gameState.stageIndex];
  if (gameState.currentPower >= required) {
    if (needsTribulation()) {
    } else {
      breakthrough();
    }
  }
  updateRealmDisplay();
  updateCultivateTab();
  buildDungeonList();
  checkAchievements(false);
}

function breakthrough() {
  var realm = REALMS[gameState.realmIndex];
  var required = realm.costs[gameState.stageIndex];
  gameState.currentPower -= required;
  gameState.stageIndex++;
  if (gameState.stageIndex >= 9) {
    gameState.stageIndex = 0;
    gameState.realmIndex++;
    if (gameState.realmIndex >= REALMS.length) {
      gameState.realmIndex = REALMS.length - 1;
      gameState.stageIndex = 8;
      gameState.currentPower = 0;
    }
  }
  updateRealmDisplay();
  updateCultivateTab();
  maybeShowDemoComplete();
  checkAchievements(false);
  buildAchievementTab();
}

function doTribulation() {
  if (!needsTribulation()) return;
  var currentRealm = REALMS[gameState.realmIndex];
  var nextRealm = REALMS[gameState.realmIndex + 1];
  var required = currentRealm.costs[8];
  if (gameState.currentPower < required) {
    showToast('灵力不足，无法渡劫');
    return;
  }

  var req = getTribulationRequirement();
  if (req && (!gameState.skills[req.skill] || !gameState.skills[req.skill].owned)) {
    showToast(req.message);
    return;
  }

  gameState.currentPower -= required;
  gameState.stageIndex = 0;
  gameState.realmIndex++;
  showToast('渡劫成功！踏入' + nextRealm.name + '境界！');
  updateRealmDisplay();
  updateCultivateTab();
  buildDungeonList();
  buildChallengeList();
  maybeShowDemoComplete();
  checkAchievements(false);
  buildAchievementTab();
}

function startCultivate() {
  if (cultivateInterval) return;
  cultivateInterval = setInterval(cultivateTick, BALANCE.cultivateTickMs);
}

function stopCultivate() {
  if (cultivateInterval) {
    clearInterval(cultivateInterval);
    cultivateInterval = null;
  }
}

function updateCultivateTab() {
  var gps = getGainPerSec();
  document.getElementById('cult-gain').textContent = fmtNum(gps);
  document.getElementById('cult-aptitude').textContent = gameState.aptitude.toFixed(2);
  document.getElementById('cult-skill').textContent = '×' + getSkillMultiplier().toFixed(2);
  document.getElementById('cult-equip-cult').textContent = '×' + getEquipCultivateMultiplier().toFixed(2);
  document.getElementById('cult-equip-battle').textContent = '×' + getEquipBattleMultiplier().toFixed(2);
  var realm = REALMS[gameState.realmIndex];
  var required = realm.costs[gameState.stageIndex];
  var remaining = Math.max(0, required - gameState.currentPower);
  var sec = gps > 0 ? Math.ceil(remaining / gps) : '∞';
  document.getElementById('cult-eta').textContent = (gps === 0 ? '无' : sec + '秒');
  document.getElementById('formula-atk').textContent = baseATKs[gameState.realmIndex];
  document.getElementById('formula-hp').textContent = baseHPs[gameState.realmIndex];
  document.getElementById('formula-gain').textContent = baseGains[gameState.realmIndex];
}

function serializeState() {
  return JSON.stringify(gameState);
}

function deserializeState(str) {
  var data = JSON.parse(str);
  gameState.realmIndex = data.realmIndex || 0;
  gameState.stageIndex = data.stageIndex || 0;
  gameState.currentPower = data.currentPower || 0;
  gameState.aptitude = data.aptitude || 1.0;
  gameState.spiritStones = data.spiritStones || 0;
  gameState.inventory = data.inventory || {};
  gameState.completedChallenges = data.completedChallenges || [];
  gameState.achievements = data.achievements || {};
  gameState.stats = data.stats || getDefaultStats();
  gameState.pendingEncounter = null;
  gameState.introSeen = data.introSeen !== false;
  gameState.demoCompleteSeen = data.demoCompleteSeen === true;
  if (data.skills) {
    Object.keys(data.skills).forEach(function(id) {
      gameState.skills[id] = data.skills[id];
    });
    if (!gameState.skills.ningmai_shu) {
      gameState.skills.ningmai_shu = { owned: false, levelIndex: 0, currentXp: 0 };
    }
    if (!gameState.skills.zhuji_xinfa) {
      gameState.skills.zhuji_xinfa = { owned: false, levelIndex: 0, currentXp: 0 };
    }
  }
  if (data.equipment) {
    gameState.equipment = data.equipment;
    if (!gameState.equipment.shisha_xianglian) {
      gameState.equipment.shisha_xianglian = { owned: false, qualityIndex: 0 };
    }
    if (!gameState.equipment.xuantiejian) {
      gameState.equipment.xuantiejian = { owned: false, qualityIndex: 0 };
    }
    if (!gameState.equipment.lingxinyu) {
      gameState.equipment.lingxinyu = { owned: false, qualityIndex: 0 };
    }
    if (!gameState.equipment.ningmai_lingyu) {
      gameState.equipment.ningmai_lingyu = { owned: false, qualityIndex: 0 };
    }
    if (!gameState.equipment.qingmingjian) {
      gameState.equipment.qingmingjian = { owned: false, qualityIndex: 0 };
    }
    if (!gameState.equipment.zhuji_lingyu) {
      gameState.equipment.zhuji_lingyu = { owned: false, qualityIndex: 0 };
    }
  } else {
    gameState.equipment = { julingzhu: { owned: true, qualityIndex: 0 }, xuantiejian: { owned: false, qualityIndex: 0 }, lingxinyu: { owned: false, qualityIndex: 0 }, shisha_xianglian: { owned: false, qualityIndex: 0 }, ningmai_lingyu: { owned: false, qualityIndex: 0 }, qingmingjian: { owned: false, qualityIndex: 0 }, zhuji_lingyu: { owned: false, qualityIndex: 0 } };
  }
  ensureGameStateShape();
  checkAchievements(true);
}

function resetNewGameState(introSeen) {
  gameState.realmIndex = 0;
  gameState.stageIndex = 0;
  gameState.currentPower = 0;
  gameState.aptitude = 1.0;
  gameState.spiritStones = 0;
  gameState.inventory = {};
  gameState.completedChallenges = [];
  gameState.achievements = {};
  gameState.stats = getDefaultStats();
  gameState.pendingEncounter = null;
  gameState.introSeen = introSeen === true;
  gameState.demoCompleteSeen = false;
  gameState.skills = {
    duanti_shu: { owned: true, levelIndex: 0, currentXp: 0 },
    lianqi_jue: { owned: false, levelIndex: 0, currentXp: 0 },
    ningmai_shu: { owned: false, levelIndex: 0, currentXp: 0 },
    zhuji_xinfa: { owned: false, levelIndex: 0, currentXp: 0 }
  };
  gameState.equipment = {
    julingzhu: { owned: true, qualityIndex: 0 },
    xuantiejian: { owned: false, qualityIndex: 0 },
    lingxinyu: { owned: false, qualityIndex: 0 },
    shisha_xianglian: { owned: false, qualityIndex: 0 },
    ningmai_lingyu: { owned: false, qualityIndex: 0 },
    qingmingjian: { owned: false, qualityIndex: 0 },
    zhuji_lingyu: { owned: false, qualityIndex: 0 }
  };
  ensureGameStateShape();
  checkAchievements(true);
}

function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, 2000);
}

function saveGame() {
  if (!currentSlot) {
    showToast('无存档槽位');
    return;
  }
  persistCurrentSlot();
  showToast('保存成功 · 存档 ' + currentSlot);
}

var introStoryIndex = 0;
var introStoryLines = [
  '山下十六年，我只知日出而作，日落而息。',
  '直到那夜，后山古井中浮出一枚残破玉简，冷光如月，照得满院草木皆静。',
  '玉简中只余半卷《锻体术》，字迹斑驳，却有灵气沿着指尖流入经脉。',
  '我听见心底有一个声音问：若天地有道，你敢不敢走上去？',
  '从今日起，我不再只求柴米温饱。我要修道。我要成仙。'
];

function persistCurrentSlot() {
  if (!currentSlot) return;
  localStorage.setItem('xiudao_save_' + currentSlot, serializeState());
}

function startAutoSave() {
  if (autoSaveInterval) return;
  autoSaveInterval = setInterval(function() {
    persistCurrentSlot();
  }, 30000);
}

function stopAutoSave() {
  if (!autoSaveInterval) return;
  clearInterval(autoSaveInterval);
  autoSaveInterval = null;
}

function showIntroStory() {
  stopCultivate();
  introStoryIndex = 0;
  var overlay = document.getElementById('intro-story-overlay');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('intro-story-reward').style.display = 'none';
  document.getElementById('intro-story-next').textContent = '继续';
  document.getElementById('intro-story-lines').innerHTML = '';
  document.getElementById('intro-story-scroll').scrollTop = 0;
  revealIntroLine();
}

function revealIntroLine() {
  var lines = document.getElementById('intro-story-lines');
  var scroll = document.getElementById('intro-story-scroll');
  var line = document.createElement('div');
  line.className = 'intro-story-line';
  line.textContent = introStoryLines[introStoryIndex];
  lines.appendChild(line);
  requestAnimationFrame(function() {
    scroll.scrollTop = scroll.scrollHeight;
  });
  if (introStoryIndex === introStoryLines.length - 1) {
    document.getElementById('intro-story-reward').style.display = 'block';
    document.getElementById('intro-story-next').textContent = '踏上修行路';
  }
}

function advanceIntroStory() {
  introStoryIndex++;
  if (introStoryIndex >= introStoryLines.length) {
    finishIntroStory();
    return;
  }
  revealIntroLine();
}

function finishIntroStory() {
  gameState.introSeen = true;
  checkAchievements(false);
  persistCurrentSlot();
  var overlay = document.getElementById('intro-story-overlay');
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  startCultivate();
}

function maybeShowDemoComplete() {
  if (gameState.demoCompleteSeen || gameState.realmIndex < 3) return;
  gameState.demoCompleteSeen = true;
  checkAchievements(false);
  persistCurrentSlot();
  var overlay = document.getElementById('demo-complete-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeDemoComplete() {
  var overlay = document.getElementById('demo-complete-overlay');
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  persistCurrentSlot();
}

function exportSave() {
  var str = serializeState();
  navigator.clipboard.writeText(str).then(function() {
    showToast('存档已复制到剪贴板');
  }).catch(function() {
    var input = document.createElement('textarea');
    input.value = str;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('存档已复制到剪贴板');
  });
}

function returnToMenu() {
  if (exploring) {
    stopExplore('back');
  }
  persistCurrentSlot();
  stopAutoSave();
  stopCultivate();
  document.getElementById('game-container').classList.remove('active');
  document.getElementById('main-container').style.display = 'flex';
  document.getElementById('main-container').classList.remove('dimmed');
  document.getElementById('save-overlay').classList.remove('active');
  showToast('已返回首页');
}

function applyColorTheme(theme) {
  var useLight = theme !== 'dark';
  document.body.classList.toggle('light-theme', useLight);
}

function toggleColorTheme() {
  var nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  applyColorTheme(nextTheme);
  localStorage.setItem('xiudao_color_theme', nextTheme);
  showToast(nextTheme === 'light' ? '已切换为浅色' : '已切换为深色');
}

function toggleImport() {
  var area = document.getElementById('save-import-area');
  area.classList.toggle('show');
  if (area.classList.contains('show')) {
    document.getElementById('save-import-input').value = '';
  }
}

var pendingImportData = null;

function doImport() {
  var str = document.getElementById('save-import-input').value.trim();
  if (!str) {
    showToast('请输入存档字符串');
    return;
  }
  try {
    pendingImportData = JSON.parse(str);
  } catch (e) {
    showToast('存档格式错误');
    return;
  }
  document.getElementById('save-import-area').classList.remove('show');
  buildImportSlots();
}

function buildImportSlots() {
  var container = document.getElementById('import-slots');
  var html = '';
  for (var i = 1; i <= 5; i++) {
    var key = 'xiudao_save_' + i;
    var data = localStorage.getItem(key);
    var info = '空 存 档';
    if (data) {
      try {
        var s = JSON.parse(data);
        var realmName = REALMS[s.realmIndex] ? REALMS[s.realmIndex].name : '?';
        info = realmName + ' · ' + CHINESE_NUM[(s.stageIndex || 0) + 1] + '阶';
      } catch (e) { info = '损 坏'; }
    }
    html += '<button class="save-slot" onclick="confirmImportTo(' + i + ')">';
    html += '<span class="slot-number">' + ['', '壹', '贰', '叁', '肆', '伍'][i] + '</span>';
    html += '<span class="slot-info" style="font-size:13px;">' + info + ' → 将覆盖</span>';
    html += '<span class="slot-arrow">▶</span>';
    html += '</button>';
  }
  container.innerHTML = html;
  document.getElementById('import-slot-picker').style.display = '';
  document.getElementById('import-slot-picker').classList.add('show');
}

function confirmImportTo(slotNum) {
  if (!pendingImportData) return;
  var key = 'xiudao_save_' + slotNum;
  localStorage.setItem(key, JSON.stringify(pendingImportData));
  pendingImportData = null;
  document.getElementById('import-slot-picker').classList.remove('show');
  document.getElementById('import-slot-picker').style.display = 'none';
  loadSaveInfo();
  showToast('已导入至存档 ' + slotNum);
}

function cancelImportPick() {
  pendingImportData = null;
  document.getElementById('import-slot-picker').classList.remove('show');
  document.getElementById('import-slot-picker').style.display = 'none';
}

function initTabs() {
  var btns = document.querySelectorAll('.tab-btn');
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      btns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var panels = document.querySelectorAll('.tab-panel');
      panels.forEach(function(p) { p.classList.remove('active'); });
      document.getElementById('tab-' + btn.getAttribute('data-tab')).classList.add('active');
    if (btn.getAttribute('data-tab') === 'alchemy') {
      buildAlchemyTab();
    }
    if (btn.getAttribute('data-tab') === 'challenge') {
      buildChallengeList();
    }
    if (btn.getAttribute('data-tab') === 'skill') {
      buildSkillTab();
    }
    if (btn.getAttribute('data-tab') === 'equip') {
      buildEquipTab();
    }
    if (btn.getAttribute('data-tab') === 'achievement') {
      buildAchievementTab();
    }
    });
  });
}

function buildAlchemyTab() {
  var container = document.getElementById('alchemy-container');
  var hasItems = false;
  var html = '';

  Object.keys(ITEMS).forEach(function(itemId) {
    var count = gameState.inventory[itemId] ? gameState.inventory[itemId].count : 0;
    if (count > 0) {
      hasItems = true;
      var item = ITEMS[itemId];
      html += '<div class="item-card">';
      html += '<span class="item-icon">' + item.icon + '</span>';
      html += '<div class="item-info">';
      html += '<div class="item-name">' + item.name + '</div>';
      html += '<div class="item-effect">' + item.effect + '</div>';
      html += '</div>';
      html += '<span class="item-count">×' + count + '</span>';
      html += '<button class="btn-use" onclick="useItem(\'' + itemId + '\')">使 用</button>';
      html += '<button class="btn-use" style="background:linear-gradient(180deg, #ff9800 0%, #e68900 100%);border-color:#b87400;padding:8px 10px;font-size:12px;" onclick="useAllOfItem(\'' + itemId + '\')">全部</button>';
      html += '</div>';
    }
  });

  if (!hasItems) {
    container.innerHTML = '<div class="alchemy-empty">暂无丹药，探索副本获取</div>';
  } else {
    container.innerHTML = html + '<div class="alchemy-divider"></div><button class="btn-use" style="width:100%;background:linear-gradient(180deg, #ff9800 0%, #e68900 100%);border-color:#b87400;" onclick="useAllItems()">一 键 使 用</button>';
  }
}

function useItem(itemId) {
  var count = gameState.inventory[itemId] ? gameState.inventory[itemId].count : 0;
  if (count <= 0) {
    showToast('没有该物品');
    return;
  }
  var item = ITEMS[itemId];
  if (!item) return;

  if (item.type === 'power') {
    gameState.currentPower += item.value;
    showToast('使用 ' + item.name + '，灵力 +' + item.value);
  } else if (item.type === 'aptitude') {
    gameState.aptitude += item.value;
    showToast('使用 ' + item.name + '，资质 +' + item.value.toFixed(2));
  }

  gameState.inventory[itemId].count--;
  if (gameState.inventory[itemId].count <= 0) {
    delete gameState.inventory[itemId];
  }

  trackStat('itemsUsed', 1);
  updateRealmDisplay();
  updateCultivateTab();
  buildAlchemyTab();
  buildAchievementTab();
}

function useAllOfItem(itemId) {
  var count = gameState.inventory[itemId] ? gameState.inventory[itemId].count : 0;
  if (count <= 0) {
    showToast('没有该物品');
    return;
  }
  var item = ITEMS[itemId];
  if (!item) return;

  if (item.type === 'power') {
    gameState.currentPower += item.value * count;
    showToast('使用 ' + count + ' 个' + item.name + '，灵力 +' + (item.value * count));
  } else if (item.type === 'aptitude') {
    gameState.aptitude += item.value * count;
    showToast('使用 ' + count + ' 个' + item.name + '，资质 +' + (item.value * count).toFixed(2));
  }

  delete gameState.inventory[itemId];
  trackStat('itemsUsed', count);
  updateRealmDisplay();
  updateCultivateTab();
  buildAlchemyTab();
  buildAchievementTab();
}

function buildSkillTab() {
  var container = document.getElementById('skill-container');
  var html = '';
  var hasSkills = false;

  Object.keys(SKILLS).forEach(function(skillId) {
    var skillDef = SKILLS[skillId];
    var ss = gameState.skills[skillId];
    if (!ss || !ss.owned) return;
    hasSkills = true;

    var curLevel = ss.levelIndex;
    var curXp = ss.currentXp;
    var isMax = curLevel >= skillDef.levels.length - 1;
    var levelData = skillDef.levels[curLevel];
    var needXp = levelData.xp;
    var pct = isMax ? 100 : Math.min(100, Math.floor(curXp / needXp * 100));
    var lockText = isMax ? '' : getSkillLevelLockText(skillId);
    var r = 34;
    var circ = 2 * Math.PI * r;
    var offset = circ - (circ * pct / 100);

    html += '<div class="skill-card">';
    html += '<div class="skill-ring-wrap">';
    html += '<svg class="skill-ring-svg" width="80" height="80" viewBox="0 0 80 80">';
    html += '<circle class="skill-ring-bg" cx="40" cy="40" r="' + r + '"/>';
    html += '<circle class="skill-ring-fill" cx="40" cy="40" r="' + r + '" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"/>';
    html += '</svg>';
    html += '<div class="skill-ring-text">';
    html += '<div class="skill-ring-pct">' + (isMax ? '满' : pct + '%') + '</div>';
    html += '<div class="skill-ring-level">' + levelData.name + '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="skill-info">';
    html += '<div class="skill-name">' + skillDef.icon + ' ' + skillDef.name + '</div>';
    html += '<div class="skill-desc">' + skillDef.desc + '</div>';
    html += '<div class="skill-bonus">功法倍率 +' + levelData.bonus.toFixed(2) + '</div>';
    if (!isMax) {
      html += '<div class="skill-xp-row"><span>修为 ' + curXp + ' / ' + needXp + '</span></div>';
      if (lockText) {
        html += '<div class="skill-xp-row"><span>' + lockText + '</span></div>';
      }
      html += '<button class="btn-cultivate-skill" id="cult-btn-' + skillId + '" onclick="cultivateSkill(\'' + skillId + '\')"' + (lockText ? ' disabled' : '') + '>修 炼 (+' + getSkillXpPerClick() + ')</button>';
      html += '<div class="skill-cultivate-bar-wrap" id="cult-bar-wrap-' + skillId + '"><div class="skill-cultivate-bar" id="cult-bar-' + skillId + '"></div></div>';
    } else {
      html += '<div class="skill-xp-row"><span>已臻圆满</span></div>';
    }
    html += '</div>';
    html += '</div>';
  });

  if (!hasSkills) {
    container.innerHTML = '<div class="alchemy-empty">暂无功法</div>';
  } else {
    container.innerHTML = html;
  }
}

var cultivatingSkill = null;

function cultivateSkill(skillId) {
  var ss = gameState.skills[skillId];
  if (!ss || !ss.owned) return;
  var skillDef = SKILLS[skillId];
  if (ss.levelIndex >= skillDef.levels.length - 1) return;
  var lockText = getSkillLevelLockText(skillId);
  if (lockText) {
    showToast(lockText);
    return;
  }
  if (cultivatingSkill) return;

  cultivatingSkill = skillId;
  var btn = document.getElementById('cult-btn-' + skillId);
  var barWrap = document.getElementById('cult-bar-wrap-' + skillId);
  var bar = document.getElementById('cult-bar-' + skillId);
  if (btn) btn.disabled = true;
  if (barWrap) barWrap.classList.add('show');

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      if (bar) bar.style.width = '100%';
    });
  });

  setTimeout(function() {
    var xpGain = getSkillXpPerClick();
    ss.currentXp += xpGain;
    var needXp = skillDef.levels[ss.levelIndex].xp;

    while (ss.currentXp >= needXp && ss.levelIndex < skillDef.levels.length - 1) {
      var nextLevel = ss.levelIndex + 1;
      var req = getSkillLevelRequirement(skillId, nextLevel);
      if (req && !meetsRealmStage(req.realm, req.stage)) {
        ss.currentXp = needXp;
        showToast('已达当前可修炼上限，' + getSkillLevelLockText(skillId));
        break;
      }
      ss.currentXp -= needXp;
      ss.levelIndex++;
      if (ss.levelIndex >= skillDef.levels.length - 1) {
        ss.currentXp = 0;
        showToast(skillDef.name + ' 突破至 ' + skillDef.levels[ss.levelIndex].name + '！');
        break;
      }
      needXp = skillDef.levels[ss.levelIndex].xp;
      showToast(skillDef.name + ' 突破至 ' + skillDef.levels[ss.levelIndex].name + '！');
    }

    cultivatingSkill = null;
    updateRealmDisplay();
    updateCultivateTab();
    buildSkillTab();
    checkAchievements(false);
    buildAchievementTab();
  }, BALANCE.skillCultivateMs);
}

function useAllItems() {
  var totalPower = 0;
  var totalAptitude = 0;
  var usedPowerCount = 0;
  var usedAptitudeCount = 0;
  Object.keys(ITEMS).forEach(function(itemId) {
    var count = gameState.inventory[itemId] ? gameState.inventory[itemId].count : 0;
    if (count > 0) {
      var item = ITEMS[itemId];
      if (item.type === 'power') {
        totalPower += item.value * count;
        usedPowerCount += count;
      } else if (item.type === 'aptitude') {
        totalAptitude += item.value * count;
        usedAptitudeCount += count;
      }
      delete gameState.inventory[itemId];
    }
  });
  if (usedPowerCount === 0 && usedAptitudeCount === 0) {
    showToast('没有可使用的丹药');
    return;
  }
  if (usedPowerCount > 0) {
    gameState.currentPower += totalPower;
  }
  if (usedAptitudeCount > 0) {
    gameState.aptitude += totalAptitude;
  }
  trackStat('itemsUsed', usedPowerCount + usedAptitudeCount);
  var msg = '一键使用 ' + (usedPowerCount + usedAptitudeCount) + ' 个丹药';
  if (usedPowerCount > 0) msg += '，灵力 +' + totalPower;
  if (usedAptitudeCount > 0) msg += '，资质 +' + totalAptitude.toFixed(2);
  showToast(msg);
  updateRealmDisplay();
  updateCultivateTab();
  buildAlchemyTab();
  buildAchievementTab();
}

function buildEquipTab() {
  var container = document.getElementById('equip-container');
  var hasEquip = false;
  var html = '';

  Object.keys(EQUIPMENT).forEach(function(eqId) {
    var eqData = gameState.equipment[eqId];
    if (!eqData || !eqData.owned) return;
    hasEquip = true;
    var def = EQUIPMENT[eqId];
    var qi = eqData.qualityIndex;
    var qual = EQUIP_QUALITIES[qi];
    var isMax = qi >= EQUIP_QUALITIES.length - 1;
    var currentMulti = (1.0 + def.baseEffect * qual.multiplier);
    var nextMulti = isMax ? null : (1.0 + def.baseEffect * EQUIP_QUALITIES[qi + 1].multiplier);
    var effectLabel = def.type === 'cultivate_speed' ? '修炼速度' : '攻击&血量';
    var effectText = effectLabel + ' ×' + currentMulti.toFixed(2);
    if (nextMulti) {
      effectText += ' → 下一品质 ×' + nextMulti.toFixed(2);
    }

    html += '<div class="equip-card">';
    html += '<div class="equip-icon-wrap quality-' + qi + '">' + def.icon + '</div>';
    html += '<div class="equip-info">';
    html += '<div class="equip-name-row">';
    html += '<span class="equip-name">' + def.name + '</span>';
    html += '<span class="equip-quality-badge q' + qi + '">' + qual.name + '</span>';
    html += '</div>';
    html += '<div class="equip-desc">' + def.desc + '</div>';
    html += '<div class="equip-effect">' + effectText + '</div>';
    html += '</div>';
    html += '<div class="equip-actions">';
    if (isMax) {
      html += '<span class="equip-max-badge">已达 极品</span>';
    } else {
      var cost = def.upgradeCosts[qi];
      html += '<div class="equip-cost">灵石 <span class="cost-amount">' + fmtNum(cost) + '</span></div>';
      var canAfford = gameState.spiritStones >= cost;
      html += '<button class="btn-upgrade" onclick="upgradeEquip(\'' + eqId + '\')"' + (canAfford ? '' : ' disabled') + '>升 级</button>';
    }
    html += '</div>';
    html += '</div>';
  });

  if (!hasEquip) {
    container.innerHTML = '<div class="equip-empty">暂无装备</div>';
  } else {
    container.innerHTML = html;
  }
}

function upgradeEquip(eqId) {
  var eqData = gameState.equipment[eqId];
  if (!eqData || !eqData.owned) return;
  var def = EQUIPMENT[eqId];
  var qi = eqData.qualityIndex;
  if (qi >= EQUIP_QUALITIES.length - 1) return;
  var cost = def.upgradeCosts[qi];
  if (gameState.spiritStones < cost) {
    showToast('灵石不足');
    return;
  }
  gameState.spiritStones -= cost;
  eqData.qualityIndex++;
  var newQual = EQUIP_QUALITIES[eqData.qualityIndex];
  showToast(def.name + ' 升级至 ' + newQual.name + '！');
  updateRealmDisplay();
  updateCultivateTab();
  buildEquipTab();
}

var currentDungeon = null;
var exploring = false;
var exploreTimer = null;
var exploreStatusTimer = null;
var exploreBattleTimer = null;
var exploreSteps = 0;
var exploreKills = 0;
var exploreEventCount = 0;
var exploreStartedAt = 0;
var explorePlayerHP = 0;
var exploreSessionLoot = null;

function setMonsterListVisible(visible) {
  var titles = document.querySelectorAll('.detail-section-title');
  titles.forEach(function(title) {
    if (title.textContent === '怪物列表') {
      title.style.display = visible ? '' : 'none';
    }
  });
  var list = document.getElementById('monster-list');
  if (list) list.style.display = visible ? '' : 'none';
}

function requireToText(realmIdx, stageIdx) {
  return REALMS[realmIdx].name + ' · ' + CHINESE_NUM[stageIdx + 1] + '阶';
}

function meetsReq(dungeon) {
  if (gameState.realmIndex < dungeon.requireRealm) return false;
  if (gameState.realmIndex === dungeon.requireRealm && gameState.stageIndex < dungeon.requireStage) return false;
  return true;
}

function buildDungeonList() {
  var list = document.getElementById('dungeon-list');
  list.innerHTML = '';
  DUNGEONS.forEach(function(d) {
    var card = document.createElement('div');
    card.className = 'dungeon-card';
    var unlocked = meetsReq(d);
    if (!unlocked) card.classList.add('locked');
    card.innerHTML =
      '<span class="dungeon-icon">' + d.icon + '</span>' +
      '<div class="dungeon-info">' +
        '<div class="dungeon-name">' + d.name + '</div>' +
        '<div class="dungeon-req">' + (unlocked ? '需要境界：' + requireToText(d.requireRealm, d.requireStage) : '需要境界：' + requireToText(d.requireRealm, d.requireStage) + '（未满足）') + '</div>' +
      '</div>' +
      '<span class="dungeon-arrow">▶</span>';
    if (unlocked) {
      card.addEventListener('click', function() { openDungeonDetail(d); });
    }
    list.appendChild(card);
  });
}

function openDungeonDetail(dungeon) {
  currentDungeon = dungeon;
  document.getElementById('dungeon-list-view').classList.remove('active');
  document.getElementById('dungeon-detail-view').classList.add('active');
  document.getElementById('detail-title').textContent = dungeon.icon + ' ' + dungeon.name;
  document.getElementById('detail-desc').textContent = dungeon.desc;
  document.getElementById('btn-explore').disabled = false;
  document.getElementById('btn-explore').textContent = '开 始 游 历';
  document.getElementById('explore-status').style.display = 'none';
  setMonsterListVisible(true);

  var mList = document.getElementById('monster-list');
  mList.innerHTML = '';
  dungeon.monsters.forEach(function(m) {
    var row = document.createElement('div');
    row.className = 'monster-row';
    var dropsHtml = '';
    if (m.drops) {
      m.drops.forEach(function(d) {
        var pct = Math.round(d.rate * 100);
        dropsHtml += '<span class="monster-drop">' + d.name + ' ×' + d.count + ' (' + pct + '%)</span>';
      });
    }
    row.innerHTML =
      '<div class="monster-row-top"><span class="monster-name">' + m.name + '</span><span class="monster-stats">血量 ' + m.hp + ' | 攻击 ' + m.atk + (m.stones != null ? ' | 灵石 ' + m.stones : '') + '</span></div>' +
      '<div class="monster-drops">' + dropsHtml + '</div>';
    mList.appendChild(row);
  });

  document.getElementById('explore-log').innerHTML = '';
  document.getElementById('log-title').style.display = 'none';
  hideEncounterPanel();
}

function backToDungeonList() {
  if (exploring) {
    stopExplore('back');
  }
  document.getElementById('dungeon-detail-view').classList.remove('active');
  document.getElementById('dungeon-list-view').classList.add('active');
  currentDungeon = null;
}

function addLog(msg, cls) {
  var log = document.getElementById('explore-log');
  var entry = document.createElement('div');
  entry.className = 'log-entry ' + (cls || '');
  entry.textContent = msg;
  log.appendChild(entry);
  while (log.children.length > BALANCE.exploreLogLimit) {
    log.removeChild(log.firstChild);
  }
  log.scrollTop = log.scrollHeight;
}

function addToInventory(itemId, itemName, count) {
  if (!gameState.inventory[itemId]) {
    gameState.inventory[itemId] = { name: itemName, count: 0 };
  }
  gameState.inventory[itemId].count += count;
}

function exploreStep() {
  if (!currentDungeon || !exploring) return;

  var monsters = currentDungeon.monsters;
  if (exploreMonsterIndex >= monsters.length) {
    finishExplore(true);
    return;
  }

  var monster = monsters[exploreMonsterIndex];
  var playerATK = getPlayerATK();
  var mHp = monster.hp;
  var mAtk = monster.atk;

  addLog('遭遇 ' + monster.name + '！血量 ' + mHp + ' 攻击 ' + mAtk);

  var playerHP = explorePlayerHP;
  var turns = 0;
  while (playerHP > 0 && mHp > 0 && turns < BALANCE.exploreTurnLimit) {
    mHp -= playerATK;
    if (mHp <= 0) break;
    playerHP -= mAtk;
    turns++;
  }

  explorePlayerHP = playerHP;

  if (playerHP <= 0) {
    explorePlayerHP = 0;
    addLog('被 ' + monster.name + ' 击败了！', 'lose');
    finishExplore(false);
    return;
  }

  addLog('击败了 ' + monster.name + '！', 'win');
  var maxHP = getPlayerMaxHP();
  var recoverHP = Math.ceil(maxHP * BALANCE.exploreRecoveryRate);
  explorePlayerHP = Math.min(maxHP, explorePlayerHP + recoverHP);
  addLog('调息恢复，血量 +' + recoverHP + '（' + explorePlayerHP + ' / ' + maxHP + '）', '');

  if (monster.drops) {
    monster.drops.forEach(function(drop) {
      var rate = drop.rate == null ? 1.0 : drop.rate;
      if (Math.random() < rate) {
        addToInventory(drop.id, drop.name, drop.count);
        addLog('获得 ' + drop.name + ' ×' + drop.count, 'loot');
      } else {
        addLog(drop.name + ' 未掉落', '');
      }
    });
  }
  if (monster.stones) {
    gameState.spiritStones += monster.stones;
    addLog('获得灵石 ×' + monster.stones, 'loot');
    document.getElementById('stat-stones').textContent = fmtNum(gameState.spiritStones);
  }

  exploreMonsterIndex++;
  if (exploreMonsterIndex < monsters.length) {
    addLog('继续深入……');
    setTimeout(exploreStep, BALANCE.exploreStepDelayMs);
  } else {
    addLog('副本探索完毕！', 'final');
    finishExplore(true);
  }
}

function finishExplore(success) {
  exploring = false;
  document.getElementById('btn-explore').disabled = false;
  var hp = getPlayerMaxHP();
  addLog('──── 探索结束 ────', '');
  addLog('角色血量：' + Math.min(explorePlayerHP, hp) + ' / ' + hp, '');
  var itemList = [];
  if (gameState.inventory) {
    Object.keys(gameState.inventory).forEach(function(k) {
      var item = gameState.inventory[k];
      if (item.count > 0) {
        itemList.push(item.name + ' ×' + item.count);
      }
    });
  }
  if (itemList.length > 0) {
    addLog('当前拥有：' + itemList.join('，'), 'loot');
  }
}

function startExplore() {
  if (!currentDungeon || exploring) return;
  exploring = true;
  exploreMonsterIndex = 0;
  explorePlayerHP = getPlayerMaxHP();
  exploreDrops = {};
  document.getElementById('explore-log').innerHTML = '';
  document.getElementById('log-title').style.display = 'block';
  document.getElementById('btn-explore').disabled = true;

  addLog('开始探索 ' + currentDungeon.name + '……');
  addLog('角色血量 ' + explorePlayerHP + ' | 攻击 ' + getPlayerATK());
  addLog('──────────────');
  setTimeout(exploreStep, BALANCE.exploreStartDelayMs);
}

function resetExploreSession() {
  exploreSteps = 0;
  exploreKills = 0;
  exploreEventCount = 0;
  exploreStartedAt = Date.now();
  explorePlayerHP = getPlayerMaxHP();
  exploreSessionLoot = {
    stones: 0,
    power: 0,
    aptitude: 0,
    skillXp: 0,
    items: {}
  };
}

function getExploreDurationText() {
  if (!exploreStartedAt) return '0秒';
  var sec = Math.floor((Date.now() - exploreStartedAt) / 1000);
  if (sec < 60) return sec + '秒';
  return Math.floor(sec / 60) + '分' + (sec % 60) + '秒';
}

function getExploreLootText() {
  if (!exploreSessionLoot) return '暂无';
  var parts = [];
  if (exploreSessionLoot.stones > 0) parts.push('灵石×' + fmtNum(exploreSessionLoot.stones));
  if (exploreSessionLoot.power > 0) parts.push('灵力+' + fmtNum(exploreSessionLoot.power));
  if (exploreSessionLoot.aptitude > 0) parts.push('资质+' + exploreSessionLoot.aptitude.toFixed(2));
  if (exploreSessionLoot.skillXp > 0) parts.push('功法XP+' + fmtNum(exploreSessionLoot.skillXp));
  Object.keys(exploreSessionLoot.items).forEach(function(id) {
    var item = exploreSessionLoot.items[id];
    if (item.count > 0) parts.push(item.name + '×' + item.count);
  });
  return parts.length ? parts.join('，') : '暂无';
}

function updateExploreStatus() {
  var status = document.getElementById('explore-status');
  if (!status) return;
  status.style.display = exploring || exploreStartedAt ? 'grid' : 'none';
  var maxHP = getPlayerMaxHP();
  document.getElementById('explore-status-hp').textContent = Math.max(0, explorePlayerHP) + ' / ' + maxHP;
  document.getElementById('explore-status-time').textContent = getExploreDurationText();
  document.getElementById('explore-status-kills').textContent = exploreKills;
  document.getElementById('explore-status-loot').textContent = getExploreLootText();
}

function startExploreStatusTimer() {
  if (exploreStatusTimer) clearInterval(exploreStatusTimer);
  exploreStatusTimer = setInterval(updateExploreStatus, 1000);
}

function stopExploreStatusTimer() {
  if (!exploreStatusTimer) return;
  clearInterval(exploreStatusTimer);
  exploreStatusTimer = null;
}

function recordExploreItem(itemId, itemName, count) {
  if (!exploreSessionLoot.items[itemId]) {
    exploreSessionLoot.items[itemId] = { name: itemName, count: 0 };
  }
  exploreSessionLoot.items[itemId].count += count;
}

function getRandomExploreMonster() {
  var monsters = currentDungeon.monsters;
  var totalWeight = 0;
  monsters.forEach(function(_, index) {
    totalWeight += 1 / (index + 1);
  });
  var roll = Math.random() * totalWeight;
  for (var i = 0; i < monsters.length; i++) {
    roll -= 1 / (i + 1);
    if (roll <= 0) return monsters[i];
  }
  return monsters[0];
}

function getDungeonItemTier() {
  if (!currentDungeon) return 1;
  return Math.max(1, Math.min(6, currentDungeon.requireRealm * 2 + Math.floor(currentDungeon.requireStage / 4) + 1));
}

function getEncounterById(id) {
  return ENCOUNTERS.find(function(e) { return e.id === id; }) || ENCOUNTERS[0];
}

function hideEncounterPanel() {
  var panel = document.getElementById('encounter-panel');
  if (panel) {
    panel.style.display = 'none';
    panel.innerHTML = '';
  }
}

function renderEncounterPanel(encounter) {
  var panel = document.getElementById('encounter-panel');
  if (!panel) return;
  var html = '<div class="encounter-kicker">奇遇抉择</div>';
  html += '<div class="encounter-title">' + encounter.name + '</div>';
  html += '<div class="encounter-desc">' + encounter.desc + '</div>';
  html += '<div class="encounter-options">';
  encounter.options.forEach(function(option) {
    html += '<button class="encounter-option" onclick="chooseEncounterOption(\'' + option.id + '\')">';
    html += '<span class="encounter-option-tone">' + option.tone + '</span>';
    html += '<span class="encounter-option-name">' + option.label + '</span>';
    html += '<span class="encounter-option-desc">' + option.desc + '</span>';
    html += '</button>';
  });
  html += '</div>';
  panel.innerHTML = html;
  panel.style.display = 'block';
}

function showEncounter(encounterId) {
  var encounter = getEncounterById(encounterId);
  gameState.pendingEncounter = { id: encounter.id };
  addLog('奇遇：' + encounter.name + '。请选择如何应对。', 'loot');
  renderEncounterPanel(encounter);
  updateExploreStatus();
  persistCurrentSlot();
}

function recoverExploreHP(rate, label) {
  var maxHP = getPlayerMaxHP();
  var amount = Math.ceil(maxHP * rate);
  explorePlayerHP = Math.min(maxHP, explorePlayerHP + amount);
  addLog(label + '，血量 +' + amount + '（' + explorePlayerHP + ' / ' + maxHP + '）', 'loot');
}

function damageExploreHP(rate, label) {
  var maxHP = getPlayerMaxHP();
  var amount = Math.max(1, Math.ceil(maxHP * rate));
  explorePlayerHP = Math.max(0, explorePlayerHP - amount);
  addLog(label + '，血量 -' + amount + '（' + explorePlayerHP + ' / ' + maxHP + '）', 'lose');
  if (explorePlayerHP <= 0) {
    addLog('气血耗尽，游历被迫中止。', 'lose');
    stopExplore('defeat');
    return false;
  }
  return true;
}

function grantEncounterPower(amount, label) {
  gameState.currentPower += amount;
  exploreSessionLoot.power += amount;
  addLog(label + '，灵力 +' + fmtNum(amount), 'loot');
}

function grantEncounterAptitude(amount, label) {
  gameState.aptitude += amount;
  exploreSessionLoot.aptitude += amount;
  addLog(label + '，资质 +' + amount.toFixed(2), 'loot');
}

function grantEncounterStones(amount, label) {
  gameState.spiritStones += amount;
  exploreSessionLoot.stones += amount;
  addLog(label + '，灵石 ×' + fmtNum(amount), 'loot');
}

function grantEncounterItem(extraChance) {
  var tier = getDungeonItemTier();
  var itemId = Math.random() < 0.5 ? 'lingli_dan_' + tier : 'aptitude_dan_' + tier;
  var item = ITEMS[itemId];
  if (!item) return;
  var count = 1 + (Math.random() < extraChance ? 1 : 0);
  addToInventory(itemId, item.name, count);
  recordExploreItem(itemId, item.name, count);
  addLog('获得 ' + item.name + ' ×' + count, 'loot');
}

function grantEncounterSkillXp(amount, label) {
  var skillName = grantExploreSkillXp(amount);
  if (skillName) {
    exploreSessionLoot.skillXp += amount;
    addLog(label + '，' + skillName + ' 修为 +' + amount, 'loot');
  } else {
    grantEncounterAptitude(0.02 + currentDungeon.requireRealm * 0.025, label);
  }
}

function grantExploreSkillXp(amount) {
  var skillId = null;
  Object.keys(gameState.skills).some(function(id) {
    var s = gameState.skills[id];
    var def = SKILLS[id];
    if (s && s.owned && def && s.levelIndex < def.levels.length - 1) {
      skillId = id;
      return true;
    }
    return false;
  });
  if (!skillId) return null;

  var ss = gameState.skills[skillId];
  var skillDef = SKILLS[skillId];
  ss.currentXp += amount;
  while (ss.levelIndex < skillDef.levels.length - 1) {
    var needXp = skillDef.levels[ss.levelIndex].xp;
    if (needXp == null || ss.currentXp < needXp) break;
    var nextLevel = ss.levelIndex + 1;
    var req = getSkillLevelRequirement(skillId, nextLevel);
    if (req && !meetsRealmStage(req.realm, req.stage)) break;
    ss.currentXp -= needXp;
    ss.levelIndex++;
  }
  buildSkillTab();
  updateRealmDisplay();
  updateCultivateTab();
  return skillDef.name;
}

function resolveExploreMonster(monster) {
  var playerATK = getPlayerATK();
  var mHp = monster.hp;
  var mAtk = monster.atk;
  var turns = 0;

  addLog('遭遇 ' + monster.name + '，血量 ' + mHp + '，攻击 ' + mAtk);
  while (explorePlayerHP > 0 && mHp > 0 && turns < BALANCE.exploreTurnLimit) {
    mHp -= playerATK;
    if (mHp <= 0) break;
    explorePlayerHP -= mAtk;
    turns++;
  }

  if (explorePlayerHP <= 0) {
    explorePlayerHP = 0;
    addLog('你被 ' + monster.name + ' 击败，游历被迫中止。', 'lose');
    updateExploreStatus();
    stopExplore('defeat');
    return;
  }

  exploreKills++;
  addLog('击败 ' + monster.name + '，剩余血量 ' + explorePlayerHP, 'win');
  if (monster.drops) {
    monster.drops.forEach(function(drop) {
      var rate = drop.rate == null ? 1.0 : drop.rate;
      if (Math.random() < rate) {
        addToInventory(drop.id, drop.name, drop.count);
        recordExploreItem(drop.id, drop.name, drop.count);
        addLog('获得 ' + drop.name + ' ×' + drop.count, 'loot');
      }
    });
  }
  if (monster.stones) {
    gameState.spiritStones += monster.stones;
    exploreSessionLoot.stones += monster.stones;
    addLog('获得灵石 ×' + monster.stones, 'loot');
  }
  updateRealmDisplay();
  buildAlchemyTab();
  updateExploreStatus();
  persistCurrentSlot();
}

function resolveExploreRecovery() {
  var maxHP = getPlayerMaxHP();
  var rate = 0.22 + Math.random() * 0.14;
  var recoverHP = Math.ceil(maxHP * rate);
  explorePlayerHP = Math.min(maxHP, explorePlayerHP + recoverHP);
  addLog('寻得静处调息，血量 +' + recoverHP + '（' + explorePlayerHP + ' / ' + maxHP + '）');
  updateExploreStatus();
}

function resolveExploreResource() {
  var tier = getDungeonItemTier();
  var itemId = Math.random() < 0.70 ? 'lingli_dan_' + tier : 'aptitude_dan_' + tier;
  var item = ITEMS[itemId];
  if (item) {
    addToInventory(itemId, item.name, 1);
    recordExploreItem(itemId, item.name, 1);
    addLog('在石隙中发现 ' + item.name + ' ×1', 'loot');
    buildAlchemyTab();
  } else {
    var stones = Math.max(10, Math.floor(getPlayerATK() * 0.32));
    gameState.spiritStones += stones;
    exploreSessionLoot.stones += stones;
    addLog('发现散落灵石 ×' + stones, 'loot');
    updateRealmDisplay();
  }
  updateExploreStatus();
  persistCurrentSlot();
}

function resolveExploreEvent() {
  exploreEventCount++;
  trackStat('encounters', 1);
  var encounter = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
  showEncounter(encounter.id);
}

function chooseEncounterOption(optionId) {
  if (!exploring || !gameState.pendingEncounter) return;
  var encounter = getEncounterById(gameState.pendingEncounter.id);
  var option = encounter.options.find(function(o) { return o.id === optionId; });
  if (!option) return;
  hideEncounterPanel();
  gameState.pendingEncounter = null;
  addLog('你选择：' + option.label + '。');
  if (option.tone === '冒险') {
    trackStat('adventureChoices', 1);
  }

  if (encounter.id === 'spring') {
    if (optionId === 'safe') {
      recoverExploreHP(0.22, '灵泉洗脉');
      grantEncounterPower(Math.max(1, Math.floor(getGainPerSec() * 10)), '泉中灵气入体');
    } else if (optionId === 'risk') {
      grantEncounterPower(Math.max(1, Math.floor(getGainPerSec() * 24)), '你强行吞纳灵泉');
      if (!damageExploreHP(0.13, '灵气反噬')) return;
    } else {
      recoverExploreHP(0.36, '你在泉边静坐调息');
    }
  } else if (encounter.id === 'herb') {
    if (optionId === 'safe') {
      grantEncounterItem(0);
    } else if (optionId === 'risk') {
      grantEncounterItem(0.55);
      if (Math.random() < 0.40 && !damageExploreHP(0.09, '藤刺划破经脉')) return;
    } else {
      recoverExploreHP(0.14, '药香安神');
    }
  } else if (encounter.id === 'stele') {
    if (optionId === 'safe') {
      grantEncounterSkillXp(Math.max(1, Math.floor(getSkillXpPerClick() * 1.45)), '你观摩残碑剑痕');
    } else if (optionId === 'risk') {
      grantEncounterSkillXp(Math.max(1, Math.floor(getSkillXpPerClick() * 2.8)), '你以神识撞入碑中');
      if (!damageExploreHP(0.15, '剑意割体')) return;
    } else {
      grantEncounterAptitude(0.02 + currentDungeon.requireRealm * 0.025, '你拓下残痕，心有所悟');
    }
  } else if (encounter.id === 'lair') {
    if (optionId === 'safe') {
      recoverExploreHP(0.10, '你绕开巢穴，稳住气息');
    } else if (optionId === 'risk') {
      grantEncounterStones(Math.max(16, Math.floor(getPlayerATK() * 0.45)), '你从巢穴中取走灵石');
      if (Math.random() < 0.45 && !damageExploreHP(0.12, '巢穴妖气反扑')) return;
    } else {
      addLog('你踏入巢穴深处，主动迎战。', 'loot');
      updateRealmDisplay();
      updateCultivateTab();
      buildAlchemyTab();
      updateExploreStatus();
      checkAchievements(false);
      persistCurrentSlot();
      resolveExploreMonster(getRandomExploreMonster());
      return;
    }
  }

  updateRealmDisplay();
  updateCultivateTab();
  buildAlchemyTab();
  updateExploreStatus();
  checkAchievements(false);
  persistCurrentSlot();
  if (exploring) scheduleExploreTick();
}

function getBattleComment(type, name) {
  var playerLines = [
    '你运转灵力，一击逼近' + name + '。',
    '你踏步出手，灵光破开妖气。',
    '你稳住气息，抓住破绽反击。'
  ];
  var monsterLines = [
    name + '低吼反扑，妖气扑面而来。',
    name + '猛然撞来，你被震退半步。',
    name + '不肯退让，爪影贴身掠过。'
  ];
  var lines = type === 'player' ? playerLines : monsterLines;
  return lines[Math.floor(Math.random() * lines.length)];
}

function settleExploreMonsterRewards(monster) {
  exploreKills++;
  addLog('击败 ' + monster.name + '。', 'win');
  if (monster.drops) {
    monster.drops.forEach(function(drop) {
      var rate = drop.rate == null ? 1.0 : drop.rate;
      if (Math.random() < rate) {
        addToInventory(drop.id, drop.name, drop.count);
        recordExploreItem(drop.id, drop.name, drop.count);
        addLog('获得 ' + drop.name + ' ×' + drop.count, 'loot');
      }
    });
  }
  if (monster.stones) {
    gameState.spiritStones += monster.stones;
    exploreSessionLoot.stones += monster.stones;
    addLog('获得灵石 ×' + monster.stones, 'loot');
  }
  updateRealmDisplay();
  buildAlchemyTab();
  updateExploreStatus();
  persistCurrentSlot();
}

function resolveExploreMonster(monster) {
  var playerATK = getPlayerATK();
  var mHp = monster.hp;
  var mAtk = monster.atk;
  var turns = 0;

  addLog('遭遇 ' + monster.name + '，血量 ' + mHp + '，攻击 ' + mAtk);

  function battleRound() {
    if (!exploring || !currentDungeon) return;
    turns++;
    mHp = Math.max(0, mHp - playerATK);
    addLog(getBattleComment('player', monster.name) + ' 造成 ' + playerATK + ' 伤害（妖兽 ' + mHp + ' / ' + monster.hp + '）');
    updateExploreStatus();

    if (mHp <= 0) {
      settleExploreMonsterRewards(monster);
      scheduleExploreTick();
      return;
    }

    exploreBattleTimer = setTimeout(function() {
      if (!exploring || !currentDungeon) return;
      explorePlayerHP = Math.max(0, explorePlayerHP - mAtk);
      addLog(getBattleComment('monster', monster.name) + ' 你承受 ' + mAtk + ' 伤害（血量 ' + explorePlayerHP + ' / ' + getPlayerMaxHP() + '）', 'lose');
      updateExploreStatus();

      if (explorePlayerHP <= 0) {
        addLog('你被 ' + monster.name + ' 击败，游历被迫中止。', 'lose');
        stopExplore('defeat');
        return;
      }

      if (turns >= BALANCE.exploreTurnLimit) {
        addLog('久战不下，你暂时撤开距离。');
        scheduleExploreTick();
        return;
      }

      exploreBattleTimer = setTimeout(battleRound, 700);
    }, 700);
  }

  exploreBattleTimer = setTimeout(battleRound, 450);
}

function exploreTick() {
  if (!currentDungeon || !exploring) return;
  exploreSteps++;
  updateExploreStatus();

  var roll = Math.random();
  if (roll < 0.58) {
    resolveExploreMonster(getRandomExploreMonster());
    return;
  } else if (roll < 0.72) {
    resolveExploreRecovery();
  } else if (roll < 0.88) {
    resolveExploreResource();
  } else {
    resolveExploreEvent();
    return;
  }

  if (!exploring) return;
  if (Math.random() < 0.16) {
    addLog('你继续向秘境深处游历……');
  }
  scheduleExploreTick();
}

function scheduleExploreTick() {
  if (!exploring) return;
  if (exploreTimer) clearTimeout(exploreTimer);
  var span = BALANCE.exploreTickMaxMs - BALANCE.exploreTickMinMs;
  var delay = BALANCE.exploreTickMinMs + Math.floor(Math.random() * span);
  exploreTimer = setTimeout(exploreTick, delay);
}

function stopExplore(reason) {
  if (exploreTimer) {
    clearTimeout(exploreTimer);
    exploreTimer = null;
  }
  if (exploreBattleTimer) {
    clearTimeout(exploreBattleTimer);
    exploreBattleTimer = null;
  }
  gameState.pendingEncounter = null;
  hideEncounterPanel();
  stopExploreStatusTimer();
  var wasExploring = exploring;
  exploring = false;
  var btn = document.getElementById('btn-explore');
  if (btn) {
    btn.disabled = false;
    btn.textContent = '开 始 游 历';
  }
  setMonsterListVisible(true);
  updateExploreStatus();
  if (!wasExploring) return;
  if (reason !== 'defeat' && exploreKills > 0) {
    trackStat('exploreRuns', 1);
  }

  if (reason === 'defeat') {
    addLog('──── 游历失败 ────', 'lose');
  } else if (reason === 'back') {
    addLog('──── 已结束本轮游历 ────');
  } else {
    addLog('──── 游历告一段落 ────', 'final');
  }
  addLog('用时 ' + getExploreDurationText() + '，击败妖兽 ' + exploreKills + '，奇遇 ' + exploreEventCount + ' 次。');
  addLog('本轮收获：' + getExploreLootText(), 'loot');
  buildAchievementTab();
  persistCurrentSlot();
}

function startExplore() {
  if (!currentDungeon) return;
  if (exploring) {
    stopExplore('manual');
    return;
  }
  resetExploreSession();
  exploring = true;
  gameState.pendingEncounter = null;
  hideEncounterPanel();
  document.getElementById('explore-log').innerHTML = '';
  document.getElementById('log-title').style.display = 'block';
  document.getElementById('btn-explore').disabled = false;
  document.getElementById('btn-explore').textContent = '停 止 游 历';
  document.getElementById('explore-status').style.display = 'grid';
  setMonsterListVisible(false);

  addLog('开始游历 ' + currentDungeon.name + '……');
  addLog('角色血量 ' + explorePlayerHP + ' | 攻击 ' + getPlayerATK());
  addLog('游历会持续进行，期间可能遭遇妖兽、奇遇或资源。');
  updateExploreStatus();
  startExploreStatusTimer();
  scheduleExploreTick();
}

var currentChallenge = null;
var challengeFighting = false;

function meetsChallengeReq(c) {
  if (gameState.realmIndex < c.requireRealm) return false;
  if (gameState.realmIndex === c.requireRealm && gameState.stageIndex < c.requireStage) return false;
  return true;
}

function isChallengeCompleted(id) {
  return gameState.completedChallenges.indexOf(id) >= 0;
}

function buildChallengeList() {
  var list = document.getElementById('challenge-list');
  list.innerHTML = '';
  CHALLENGES.forEach(function(c) {
    var card = document.createElement('div');
    card.className = 'dungeon-card';
    var unlocked = meetsChallengeReq(c);
    var completed = isChallengeCompleted(c.id);
    if (!unlocked) card.classList.add('locked');
    var statusHtml = '';
    if (completed) {
      statusHtml = '<span class="challenge-completed-badge">已完成</span>';
    }
    card.innerHTML =
      '<span class="dungeon-icon">' + c.icon + '</span>' +
      '<div class="dungeon-info">' +
        '<div class="dungeon-name">' + c.name + ' ' + statusHtml + '</div>' +
        '<div class="dungeon-req">' + (unlocked ? '需要境界：' + requireToText(c.requireRealm, c.requireStage) : '需要境界：' + requireToText(c.requireRealm, c.requireStage) + '（未满足）') + '</div>' +
      '</div>' +
      '<span class="dungeon-arrow">▶</span>';
    if (unlocked && !completed) {
      card.addEventListener('click', function() { openChallengeDetail(c); });
    }
    list.appendChild(card);
  });
}

function openChallengeDetail(c) {
  currentChallenge = c;
  document.getElementById('challenge-list-view').classList.remove('active');
  document.getElementById('challenge-detail-view').classList.add('active');
  document.getElementById('challenge-detail-title').textContent = c.icon + ' ' + c.name;
  document.getElementById('challenge-detail-desc').textContent = c.desc;
  document.getElementById('btn-challenge-fight').disabled = false;
  document.getElementById('btn-challenge-fight').style.display = '';

  var m = c.monster;
  var mList = document.getElementById('challenge-monster-list');
  mList.innerHTML = '';
  var row = document.createElement('div');
  row.className = 'monster-row';
  row.innerHTML =
    '<div class="monster-row-top"><span class="monster-name">' + m.name + '</span><span class="monster-stats">血量 ' + m.hp + ' | 攻击 ' + m.atk + '</span></div>';
  mList.appendChild(row);

  document.getElementById('challenge-log').innerHTML = '';
  document.getElementById('challenge-log-title').style.display = 'none';
  document.getElementById('challenge-result-area').innerHTML = '';
}

function backToChallengeList() {
  challengeFighting = false;
  document.getElementById('challenge-detail-view').classList.remove('active');
  document.getElementById('challenge-list-view').classList.add('active');
  currentChallenge = null;
  buildChallengeList();
}

function addChallengeLog(msg, cls) {
  var log = document.getElementById('challenge-log');
  var entry = document.createElement('div');
  entry.className = 'log-entry ' + (cls || '');
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function startChallenge() {
  if (!currentChallenge || challengeFighting) return;
  if (isChallengeCompleted(currentChallenge.id)) return;
  challengeFighting = true;
  document.getElementById('challenge-log').innerHTML = '';
  document.getElementById('challenge-log-title').style.display = 'block';
  document.getElementById('challenge-result-area').innerHTML = '';
  document.getElementById('btn-challenge-fight').disabled = true;

  var c = currentChallenge;
  var m = c.monster;
  var playerATK = getPlayerATK();
  var playerHP = getPlayerMaxHP();
  var mHp = m.hp;
  var mAtk = m.atk;

  addChallengeLog('面对 ' + m.name + '……');
  addChallengeLog('你的血量 ' + playerHP + ' | 攻击 ' + playerATK);
  addChallengeLog(m.name + ' 血量 ' + mHp + ' | 攻击 ' + mAtk);
  addChallengeLog('──────────────');

  var turns = 0;
  while (playerHP > 0 && mHp > 0 && turns < BALANCE.challengeTurnLimit) {
    mHp -= playerATK;
    addChallengeLog('你攻击 ' + m.name + '，造成 ' + playerATK + ' 伤害', mHp <= 0 ? 'win' : '');
    if (mHp <= 0) break;
    playerHP -= mAtk;
    addChallengeLog(m.name + ' 反击，造成 ' + mAtk + ' 伤害', 'lose');
    turns++;
  }

  if (mHp <= 0) {
    addChallengeLog('──────────────', '');
    addChallengeLog('你战胜了 ' + m.name + '！', 'win');
    gameState.aptitude += c.rewardAptitude;
    gameState.completedChallenges.push(c.id);
    checkAchievements(false);
    var rewardHtml = '资质 +' + c.rewardAptitude;
    if (c.rewardSkill) {
      var skillDef = SKILLS[c.rewardSkill];
      if (skillDef && gameState.skills[c.rewardSkill]) {
        gameState.skills[c.rewardSkill].owned = true;
        rewardHtml += ' · 获得' + skillDef.name;
      }
    }
    if (c.rewardEquip) {
      var eqDef = EQUIPMENT[c.rewardEquip];
      if (eqDef && gameState.equipment[c.rewardEquip]) {
        gameState.equipment[c.rewardEquip].owned = true;
        rewardHtml += ' · 获得' + eqDef.name;
      }
    }
    document.getElementById('challenge-result-area').innerHTML =
      '<div class="challenge-result win">' +
        '<div class="challenge-result-icon">✨</div>' +
        '<div class="challenge-result-title">挑战成功</div>' +
        '<div class="challenge-result-msg">' + c.winMsg + '</div>' +
        '<div class="challenge-result-reward">' + rewardHtml + '</div>' +
      '</div>';
    document.getElementById('btn-challenge-fight').style.display = 'none';
  } else {
    addChallengeLog('──────────────', '');
    addChallengeLog('你被 ' + m.name + ' 击败了……', 'lose');
    document.getElementById('challenge-result-area').innerHTML =
      '<div class="challenge-result lose">' +
        '<div class="challenge-result-icon">💔</div>' +
        '<div class="challenge-result-title">挑战失败</div>' +
        '<div class="challenge-result-msg">' + c.loseMsg + '</div>' +
      '</div>';
    document.getElementById('btn-challenge-fight').disabled = false;
  }

  updateRealmDisplay();
  updateCultivateTab();
  buildAchievementTab();
  persistCurrentSlot();
  challengeFighting = false;
}

let bgmStarted = false;

function startBGM() {
  if (bgmStarted) return;
  var bgm = document.getElementById('bgm');
  if (bgm) {
    bgm.volume = 0.5;
    bgm.play().catch(function() {});
    bgmStarted = true;
  }
}

function createStars(containerId) {
  const container = document.getElementById(containerId || 'stars');
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 1;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 60 + '%';
    star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
    star.style.setProperty('--delay', (Math.random() * 4) + 's');
    container.appendChild(star);
  }
}

function createClouds(containerId) {
  const container = document.getElementById(containerId || 'clouds');
  for (let i = 0; i < 6; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    const w = Math.random() * 120 + 80;
    cloud.style.width = w + 'px';
    cloud.style.height = (w * 0.3) + 'px';
    cloud.style.top = (Math.random() * 25 + 5) + '%';
    cloud.style.setProperty('--cloud-duration', (Math.random() * 40 + 30) + 's');
    cloud.style.animationDelay = (Math.random() * 30) + 's';
    container.appendChild(cloud);
  }
}

function openSavePanel() {
  startBGM();
  document.getElementById('main-container').classList.add('dimmed');
  document.getElementById('save-overlay').classList.add('active');
  loadSaveInfo();
}

function closeSavePanel() {
  cancelDeleteMode();
  cancelImportPick();
  document.getElementById('main-container').classList.remove('dimmed');
  document.getElementById('save-overlay').classList.remove('active');
  document.getElementById('save-import-area').classList.remove('show');
}

function loadSaveInfo() {
  const slots = document.querySelectorAll('.save-slot .slot-info');
  slots.forEach((slot, index) => {
    const key = 'xiudao_save_' + (index + 1);
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const save = JSON.parse(data);
        var realmName = REALMS[save.realmIndex] ? REALMS[save.realmIndex].name : '?';
        var stage = (save.stageIndex || 0) + 1;
        slot.textContent = realmName + ' · ' + CHINESE_NUM[stage] + '阶';
        slot.style.color = '#c9a96e';
      } catch (e) {
        slot.textContent = '空 存 档';
        slot.style.color = '#888';
      }
    } else {
      slot.textContent = '空 存 档';
      slot.style.color = '#888';
    }
  });
}

var deleteMode = false;

function enterDeleteMode() {
  deleteMode = true;
  document.getElementById('btn-delete-mode').style.display = 'none';
  document.getElementById('btn-cancel-delete').style.display = '';
  document.getElementById('delete-hint').style.display = '';
  var slots = document.querySelectorAll('.save-slot');
  slots.forEach(function(slot, index) {
    slot.classList.add('delete-target');
    slot.setAttribute('onclick', 'confirmDelete(' + (index + 1) + ')');
  });
}

function cancelDeleteMode() {
  deleteMode = false;
  document.getElementById('btn-delete-mode').style.display = '';
  document.getElementById('btn-cancel-delete').style.display = 'none';
  document.getElementById('delete-hint').style.display = 'none';
  var slots = document.querySelectorAll('.save-slot');
  slots.forEach(function(slot, index) {
    slot.classList.remove('delete-target');
    slot.setAttribute('onclick', 'selectSave(' + (index + 1) + ')');
  });
}

function confirmDelete(slotNum) {
  if (!confirm('确认删除存档 ' + slotNum + '？此操作不可撤销。')) return;
  var key = 'xiudao_save_' + slotNum;
  localStorage.removeItem(key);
  cancelDeleteMode();
  loadSaveInfo();
}

function selectSave(slotNum) {
  currentSlot = slotNum;
  var key = 'xiudao_save_' + slotNum;
  var data = localStorage.getItem(key);
  var shouldShowIntro = false;
  if (data) {
    try {
      deserializeState(data);
    } catch (e) {
      resetNewGameState(false);
      shouldShowIntro = true;
    }
  } else {
    resetNewGameState(false);
    shouldShowIntro = true;
  }
  document.getElementById('save-overlay').classList.remove('active');
  document.getElementById('main-container').classList.remove('dimmed');
  stopCultivate();
  stopAutoSave();
  setTimeout(function() {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('game-container').classList.add('active');
    updateRealmDisplay();
    updateCultivateTab();
    initTabs();
    buildDungeonList();
    buildAchievementTab();
    if (shouldShowIntro && !gameState.introSeen) {
      showIntroStory();
    } else {
      startCultivate();
    }
    startAutoSave();
  }, 500);
}

createStars();
createClouds();
createStars('game-stars');
createClouds('game-clouds');
applyColorTheme(localStorage.getItem('xiudao_color_theme') || 'light');
