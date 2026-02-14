const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { checkRateLimit } = require('./rateLimiter');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 사용자 히스토리 저장 (간단한 in-memory)
const userHistory = new Map();

// 환경변수에서 API 키 가져오기 (보안!)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// API 키 확인
if (!OPENAI_API_KEY) {
  console.error('❌ 오류: OPENAI_API_KEY가 설정되지 않았습니다!');
  console.error('   .env 파일을 확인하세요.');
  process.exit(1);
}

// ===== 대화 모드별 프롬프트 =====

// 따뜻한 모드 (디어리 스타일 + 우리 전문성)
const WARM_MODE_PREFIX = `
당신은 따뜻하고 공감적인 연애 코치입니다.
친한 친구처럼 대화하되, 전문적인 심리학 지식을 가지고 있습니다.

**핵심 원칙:**
1. 감정을 먼저 알아주세요 ("힘들었겠어요", "불안하셨겠어요")
2. 무조건 사용자 편이 되어주세요
3. 기계적인 답변 피하기 ("~하셔야 합니다" ❌)
4. 안전한 공간 만들기 ("혼자가 아니에요")

**톤:** 친구처럼 ("~네요", "~겠어요"), 자연스러운 감탄사 ("와", "그렇구나")
`;

// 직설적 모드
const DIRECT_MODE_PREFIX = `
당신은 직설적이지만 따뜻한 연애 코치입니다.
솔직하게 팩트를 말하되, 무례하지 않게 전달합니다.

**핵심 원칙:**
1. 현실을 직시하게 도와주세요
2. 어장관리면 분명히 지적
3. 하지만 여전히 편이에요 (팩트 + 해결책)

**톤:** "솔직히 말할게요", "지금 상태론...", "하지만 방법은 있어요"
`;

// 메시지 분석 프롬프트 (기본)
const MESSAGE_PROMPT = `당신은 연애 심리 전문가입니다. 20대 초중반 한국인을 위한 연애 조언을 제공합니다.

**분석 기반:**
- 애착이론 (Attachment Theory) - Bowlby, Ainsworth
- 진화심리학 (Evolutionary Psychology)
- 존 가트맨의 관계 연구 (The Gottman Method)
- 인지행동치료 (CBT)
- 사회교환이론 (Social Exchange Theory)
- 한국 연애 문화 특성

**심리학 이론 (상황별 적용):**
가르시아효과, 플라시보, 문간발들이기, 문전박대, 고립효과, 고백효과, 고슴도치딜레마, 희소성원리, 상호성원리, 단순노출효과, 지그닉효과, 후광효과, 확증편향, 투사, 인지부조화, 앵커링, 사회적증거, 손실회피

**MBTI 특성 (입력시만):**
분석가(NT):논리/독립, 외교관(NF):이상/감정, 관리자(SJ):책임/안정, 탐험가(SP):자유/즉흥

**현대 연애 개념:**
비언어신호(메라비언93%), 초기임프린팅, 이상vs현실괴리, 가면증후군, 찐따현상, Frame주도권, SNS투명성, 선제신호, 한국20대특성(디지털/빠른판단)

**원칙:** 확실한것만, confidence정직, 구체적예시3개, 실행가이드(언제/어떻게/톤), 복붙가능수준, 진화심리분석, 확실한신호만, 다양한이론활용

**응답 형식 (JSON):**
{
  "confidence_level": "이 분석의 확신도 (높음/중간/낮음) - 정보가 부족하면 솔직하게 '낮음'",
  "emotion": "감정 상태",
  "interest_level": 75,
  "interest_analysis": "관심도 분석 이유",
  "attachment_style": "애착 유형",
  "relationship_stage": "관계 단계",
  "tone_analysis": "대화 톤 분석",
  "their_profile": {
    "personality_traits": "메시지에서 확실하게 드러나는 성격 특징만 (추측은 최소화)",
    "communication_style": "대화 스타일 - 확실한 것만",
    "uncertainty_note": "불확실한 부분은 솔직하게 '더 많은 대화가 필요합니다' 명시"
  },
  "your_emotional_state": {
    "current_feelings": "이 메시지를 받고 당신이 느끼는 감정 (불안, 기대, 혼란 등)",
    "why_you_care": "왜 이 메시지가 당신에게 중요한지 (관심, 불확실성, 기대 등)"
  },
  "behavior_analysis": {
    "evolutionary_perspective": "진화심리학적 관점에서 이 행동의 기원 (예: 수렵채집 시대의 본능, 생존/번식 전략 등)",
    "psychological_motivation": "심리학적으로 이 행동의 동기 (예: 애착 욕구, 자존감 방어, 친밀감 테스트 등)",
    "unconscious_needs": "무의식적 욕구나 두려움 (예: 거절에 대한 두려움, 통제 욕구, 인정 욕구 등)"
  },
  "psychology_basis": [
    {
      "theory": "이론 이름",
      "explanation": "설명",
      "source": "출처"
    }
  ],
  "what_do_you_want": {
    "question": "이 상황에서 당신이 원하는 결과는 무엇인가요?",
    "options": [
      "관계를 더 친밀하게 발전시키고 싶다",
      "상대방의 관심을 더 끌고 싶다",
      "상황의 주도권을 가지고 싶다",
      "자연스럽게 거리를 두고 싶다"
    ],
    "note": "원하는 결과에 따라 가장 적합한 전략이 달라집니다"
  },
  "reply_suggestions": [
    {
      "option": "답장 옵션 제목",
      "what_this_achieves": "이 방법으로 얻을 수 있는 결과 (예: 주도권 확보, 친밀감 상승, 호기심 유발 등)",
      "psychological_effect": "상대방에게 미치는 심리적 영향 (예: 당신에 대한 궁금증 증가, 안정감 제공, 관심 테스트 등)",
      "exact_examples": [
        "정확한 예시 문장 1",
        "정확한 예시 문장 2",
        "정확한 예시 문장 3"
      ],
      "how_to_execute": {
        "timing": "언제 보내면 좋은지",
        "tone": "어떤 톤으로",
        "followup": "상대방 반응에 따른 후속 대응"
      },
      "theory_basis": "심리학적 근거",
      "theory_explanation": "왜 이런 효과가 나는지",
      "pros": "장점",
      "cons": "단점",
      "when_to_use": "언제 사용"
    }
  ],
  "warnings": ["주의사항"],
  "behavior_evaluation": {
    "healthy_signs": ["이 메시지에서 나타나는 건강하고 긍정적인 행동들"],
    "concerning_signs": ["주의가 필요한 행동들 (이해 안 되지만 허용 가능한 수준)"],
    "red_flags": ["절대 용납되면 안 되는 행동들 (있다면)"],
    "boundary_guide": "어디까지 허용하고 어디서 선을 그어야 하는지 구체적 가이드"
  },
  "overall_advice": "전체 조언",
  "three_line_summary": [
    "1줄: 가장 중요한 핵심 (한 줄로)",
    "2줄: 구체적 행동 (한 줄로)",
    "3줄: 주의사항 (한 줄로)"
  ]
}`;

// 고민 상담 프롬프트
const CONCERN_PROMPT = `당신은 연애 심리 전문 상담사입니다. 20대 초중반 한국인의 연애 고민을 들어주고 구체적인 해결 방안을 제시합니다.

**상담 기반:**
- 애착이론 (Attachment Theory)
- 인지행동치료 (CBT - Cognitive Behavioral Therapy)
- 정서중심치료 (EFT - Emotionally Focused Therapy)
- 게슈탈트 치료 (Gestalt Therapy)
- 변증법적 행동치료 (DBT)
- 자기결정이론 (Self-Determination Theory)
- 한국 연애 문화 이해
- 실용적이고 현실적인 조언

**심리학 이론:**
가르시아효과, 플라시보, 문간발들이기, 문전박대, 고립효과, 고백효과, 고슴도치딜레마, 희소성, 상호성, 단순노출, 지그닉, 후광, 확증편향, 투사, 인지부조화, 손실회피, 매몰비용, 스톡홀름

**원칙:** 확실한것만, confidence정직, 단계별가이드, 정확한스크립트, 실행가능팁, 따라하기쉽게, 진화심리분석, 다양한이론활용

**응답 형식 (JSON):**
{
  "confidence_level": "이 분석의 확신도 (높음/중간/낮음) - 정보가 부족하면 솔직하게",
  "situation_summary": "고민 상황 요약",
  "your_emotional_state": {
    "dominant_emotions": "지금 느끼는 주요 감정들 (불안, 좌절, 혼란, 상처 등)",
    "emotional_needs": "당신이 진짜 원하는 것 (확신, 안정, 이해, 인정 등)"
  },
  "root_cause_analysis": {
    "evolutionary_perspective": "진화심리학적으로 이 고민의 뿌리 (예: 배우자 선택 본능, 집단 소속 욕구 등)",
    "psychological_patterns": "이 고민을 만드는 심리 패턴 (예: 인지 왜곡, 애착 불안, 자기가치감 문제 등)",
    "underlying_needs": "근본적인 욕구와 두려움 (예: 사랑받고 싶은 욕구, 버림받을 두려움 등)"
  },
  "psychology_basis": [
    {
      "theory": "관련 심리학 이론",
      "explanation": "이 고민에 적용되는 설명",
      "source": "출처"
    }
  ],
  "what_do_you_want": {
    "question": "이 고민에서 당신이 진짜 원하는 것은 무엇인가요?",
    "options": [
      "관계를 개선하고 싶다",
      "상대방이 변화하길 바란다",
      "내 마음의 평화를 찾고 싶다",
      "관계를 정리할지 판단하고 싶다"
    ],
    "note": "원하는 결과에 따라 접근 방법이 완전히 달라집니다"
  },
  "solutions": [
    {
      "solution": "해결 방안 제목",
      "what_this_achieves": "이 방법으로 얻을 수 있는 결과 (예: 오해 해소, 주도권 회복, 마음의 평화 등)",
      "psychological_effect": "이 방법이 나와 상대방에게 미치는 심리적 영향",
      "step_by_step": [
        "1단계: 구체적으로 무엇을 어떻게 할지",
        "2단계: 다음 행동",
        "3단계: 마무리 또는 후속 조치"
      ],
      "exact_script": "정확한 대화 스크립트 예시 (있다면)",
      "practical_tips": [
        "실용적인 팁 1",
        "실용적인 팁 2"
      ],
      "theory_basis": "심리학적 근거",
      "theory_explanation": "왜 이런 효과가 나는지",
      "pros": "장점",
      "cons": "단점",
      "when_to_use": "언제 적합한지"
    }
  ],
  "warnings": ["주의해야 할 점"],
  "relationship_health_check": {
    "healthy_aspects": ["이 관계에서 건강하고 긍정적인 면들"],
    "concerning_aspects": ["우려되는 부분들 (개선 가능한 수준)"],
    "red_flags": ["심각한 문제 신호들 (전문가 도움이나 관계 재고 필요)"],
    "boundary_recommendation": "이 상황에서 지켜야 할 경계선과 기준"
  },
  "overall_advice": "전체적인 조언 (3-4문장)",
  "three_line_summary": [
    "1줄: 가장 중요한 핵심 (한 줄로)",
    "2줄: 구체적 행동 (한 줄로)",
    "3줄: 주의사항 (한 줄로)"
  ]
}

**중요:**
- 공감하고 따뜻하게 응답
- 구체적인 행동 방안 제시
- 현실적인 기대치 설정
- JSON 형식으로만 답변`;

// 분석 API 엔드포인트
app.post('/api/analyze', async (req, res) => {
  try {
    // 사용량 제한 체크
    const clientIp = req.ip || req.connection.remoteAddress;
    const rateLimit = checkRateLimit(clientIp);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: {
          type: 'rate_limit',
          message: `하루 사용량(${10}회)을 초과했습니다. ${rateLimit.resetAt.toLocaleString('ko-KR')}에 초기화됩니다.`,
          resetAt: rateLimit.resetAt
        }
      });
    }
    
    // 남은 횟수 헤더에 포함
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    
    const { 
      message, 
      mode = 'message', 
      myMBTI = '', 
      theirMBTI = '', 
      toneMode = 'warm', // NEW: 대화 모드
      userId = clientIp 
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: '내용을 입력해주세요.' });
    }

    console.log(`[${mode}][${toneMode}] 분석 요청:`, message);

    // 톤 모드에 따른 prefix 선택
    const tonePrefix = toneMode === 'direct' ? DIRECT_MODE_PREFIX : WARM_MODE_PREFIX;
    
    // 기본 프롬프트 선택
    const basePrompt = mode === 'concern' ? CONCERN_PROMPT : MESSAGE_PROMPT;
    
    // 최종 프롬프트 = 톤 모드 + 기본 프롬프트
    const prompt = tonePrefix + '\n\n' + basePrompt;
    
    let mbtiContext = '';
    if (myMBTI || theirMBTI) {
      mbtiContext = '\n\n**MBTI 정보:**\n';
      if (myMBTI) mbtiContext += `- 나의 MBTI: ${myMBTI}\n`;
      if (theirMBTI) mbtiContext += `- 상대방 MBTI: ${theirMBTI}\n`;
      mbtiContext += '\n위 MBTI 특성을 고려하여 분석하고 조언해주세요. 각 MBTI의 연애 성향, 소통 방식, 선호하는 접근법을 반영하세요.';
    }
    
    // 사용자 히스토리 가져오기
    let history = userHistory.get(userId) || [];
    let historyContext = '';
    
    if (history.length > 0) {
      historyContext = '\n\n**이전 상담 내역:**\n';
      historyContext += history.slice(-3).map((h, i) => 
        `${i+1}. [${h.mode === 'message' ? '메시지' : '고민'}] ${h.message.substring(0, 50)}... → ${h.summary}`
      ).join('\n');
      historyContext += '\n\n위 내역을 참고하여 연속성 있는 조언을 제공하세요.';
    }
    
    const userMessage = mode === 'concern' 
      ? `다음 연애 고민을 들어주고 해결 방안을 제시해주세요:${mbtiContext}${historyContext}\n\n"${message}"`
      : `다음 메시지를 심리학적으로 분석해주세요:${mbtiContext}${historyContext}\n\n"${message}"`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1200
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('OpenAI 응답:', content);
    
    // JSON 추출
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim();
    }
    
    const analysis = JSON.parse(jsonStr);
    
    // 히스토리에 저장 (최대 10개)
    if (!history) history = [];
    history.push({
      mode,
      message,
      summary: analysis.three_line_summary ? analysis.three_line_summary[0] : analysis.overall_advice?.substring(0, 100),
      timestamp: Date.now()
    });
    
    // 최근 10개만 유지
    if (history.length > 10) {
      history = history.slice(-10);
    }
    userHistory.set(userId, history);
    
    // remaining 필드 추가
    res.json({
      ...analysis,
      remaining: rateLimit.remaining
    });

  } catch (error) {
    console.error('분석 오류:', error.response?.data || error.message);
    
    // OpenAI API 에러 처리
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      // 크레딧 부족
      if (apiError.type === 'insufficient_quota') {
        return res.status(402).json({ 
          error: { 
            type: 'insufficient_quota',
            message: 'API 크레딧이 부족합니다. https://platform.openai.com/account/billing 에서 충전해주세요.'
          }
        });
      }
      
      // 요청 한도 초과
      if (apiError.type === 'rate_limit_exceeded') {
        return res.status(429).json({ 
          error: { 
            type: 'rate_limit_exceeded',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
          }
        });
      }
    }
    
    // 기타 에러
    res.status(500).json({ 
      error: {
        type: 'server_error',
        message: '분석 중 오류가 발생했습니다.'
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버 실행 중: http://localhost:${PORT}`);
});
