// 간단한 IP 기반 사용량 제한
const ipLimits = new Map();
const LIMIT_PER_DAY = 10; // 하루 10회 제한
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24시간

// 매일 자정에 초기화
setInterval(() => {
  ipLimits.clear();
  console.log('사용량 제한 초기화됨');
}, RESET_INTERVAL);

function checkRateLimit(ip) {
  const now = Date.now();
  const userData = ipLimits.get(ip) || { count: 0, firstRequest: now };
  
  // 24시간 지났으면 초기화
  if (now - userData.firstRequest > RESET_INTERVAL) {
    userData.count = 0;
    userData.firstRequest = now;
  }
  
  // 제한 확인
  if (userData.count >= LIMIT_PER_DAY) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(userData.firstRequest + RESET_INTERVAL)
    };
  }
  
  // 사용량 증가
  userData.count++;
  ipLimits.set(ip, userData);
  
  return {
    allowed: true,
    remaining: LIMIT_PER_DAY - userData.count,
    resetAt: new Date(userData.firstRequest + RESET_INTERVAL)
  };
}

module.exports = { checkRateLimit };
