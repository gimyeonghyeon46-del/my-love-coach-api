import axios from 'axios';

// 백엔드 서버 주소
const BACKEND_URL = 'http://localhost:3001';

export const analyzeMessage = async (message, mode = 'message', myMBTI = '', theirMBTI = '') => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/analyze`, {
      message: message,
      mode: mode,
      myMBTI: myMBTI,
      theirMBTI: theirMBTI
    }, {
      timeout: 30000 // 30초 타임아웃
    });

    return {
      data: response.data,
      remaining: response.headers['x-ratelimit-remaining']
    };
  } catch (error) {
    console.error('AI 분석 오류:', error);
    
    // 에러 종류 확인
    if (error.response?.status === 429) {
      throw new Error('API 요청 한도 초과. 잠시 후 다시 시도해주세요.');
    } else if (error.response?.data?.error?.type === 'insufficient_quota') {
      throw new Error('API 크레딧 부족. 충전이 필요합니다.');
    }
    
    // 네트워크/타임아웃 에러만 데모로 fallback
    console.log('데모 모드로 전환');
    return getDemoAnalysis(message, mode, myMBTI, theirMBTI);
  }
};

// 데모용 심리학 기반 분석 (백엔드 연결 안 될 때)
const getDemoAnalysis = (message, mode = 'message') => {
  if (mode === 'concern') {
    return getDemoConcernAnalysis(message);
  }
  const messageLength = message.length;
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(message);
  const hasExclamation = message.includes('!') || message.includes('ㅋ') || message.includes('ㅎ');
  
  const interestScore = Math.min(100, 40 + 
    (messageLength > 20 ? 20 : messageLength) +
    (hasEmoji ? 15 : 0) +
    (hasExclamation ? 15 : 0) +
    Math.floor(Math.random() * 20)
  );

  return {
    confidence_level: messageLength > 10 ? "중간" : "낮음",
    emotion: interestScore > 70 ? "긍정적 😊" : interestScore > 50 ? "중립적 😐" : "다소 소극적 😕",
    interest_level: interestScore,
    interest_analysis: `메시지 길이(${messageLength}자), ${hasEmoji ? '이모지 사용' : '이모지 없음'}, ${hasExclamation ? '감정 표현 있음' : '감정 표현 적음'}을 종합적으로 고려했습니다.`,
    attachment_style: interestScore > 70 ? "안정형" : interestScore > 50 ? "회피형" : "불안형",
    relationship_stage: "알아가는 중",
    tone_analysis: hasEmoji && hasExclamation ? "친근하고 편안한 톤" : "조심스럽고 예의 바른 톤",
    their_profile: {
      personality_traits: hasExclamation ? "긍정적이고 표현력이 있는 성격으로 보입니다" : "신중하고 차분한 성격일 가능성이 있습니다",
      communication_style: messageLength > 30 ? "대화를 이어가려는 의지가 보입니다" : "간결한 대화를 선호하는 스타일입니다",
      uncertainty_note: messageLength < 20 ? "한 번의 짧은 메시지로는 정확한 성격 파악이 어렵습니다. 더 많은 대화가 필요합니다." : null
    },
    your_emotional_state: {
      current_feelings: interestScore > 70 ? "기대감과 설렘을 느끼고 있을 것입니다" : interestScore > 40 ? "약간의 불확실성과 궁금증을 느끼고 있을 것입니다" : "불안감과 거절에 대한 두려움을 느끼고 있을 수 있습니다",
      why_you_care: "상대방의 관심과 호감을 확인하고 싶고, 관계가 어떻게 발전할지 알고 싶어 하기 때문입니다. 이는 매우 자연스러운 욕구입니다."
    },
    behavior_analysis: {
      evolutionary_perspective: "진화심리학적으로 인간은 사회적 동물로서 집단 내 관계 형성이 생존에 필수적이었습니다. " + 
        (hasExclamation ? "적극적이고 긍정적인 표현은 동맹 신호로, 협력 의지를 나타내 상호 이익을 극대화하려는 본능입니다." : 
         "신중한 태도는 위험을 최소화하려는 본능으로, 관계에서 손해를 보지 않으려는 자기 보호 메커니즘입니다."),
      psychological_motivation: hasEmoji ? 
        "친근한 표현을 통해 친밀감을 높이고 심리적 거리를 좁히려는 동기가 보입니다. 이는 관계 발전에 대한 긍정적 신호입니다." :
        "감정 표현을 절제하는 것은 거절에 대한 두려움이나, 관계에서 주도권을 유지하려는 방어적 전략일 수 있습니다.",
      unconscious_needs: messageLength > 30 ?
        "긴 답장은 인정받고 싶은 욕구, 자신을 알리고 싶은 욕구를 나타냅니다. 무의식적으로 상대방의 관심과 애정을 확인하고 싶어 합니다." :
        "짧은 답장은 감정적 투자를 최소화하려는 무의식적 방어나, 상대방이 먼저 더 많은 노력을 보이길 기대하는 심리일 수 있습니다."
    },
    psychology_basis: [
      {
        theory: hasExclamation ? "단순 노출 효과 (Mere Exposure Effect)" : "희소성 원리 (Scarcity Principle)",
        explanation: hasExclamation ? 
          "적극적이고 빈번한 감정 표현은 단순 노출 효과를 활용하는 것입니다. 자주, 긍정적으로 노출될수록 호감도가 자연스럽게 상승합니다. 이는 진화심리학적으로 '익숙함=안전함'으로 인식되기 때문입니다." :
          "절제된 표현은 희소성 원리를 만듭니다. 쉽게 얻을 수 없는 것의 가치가 높아 보이는 심리입니다. 상대방이 '이 사람을 얻기 어렵구나'라고 느끼면 오히려 더 노력하게 됩니다.",
        source: hasExclamation ? "Robert Zajonc" : "Robert Cialdini, 영향력의 법칙"
      },
      {
        theory: messageLength > 30 ? "상호성 원리 (Reciprocity Norm)" : "지그닉 효과 (Zeigarnik Effect)",
        explanation: messageLength > 30 ?
          "긴 답장은 상호성 원리를 촉발합니다. 상대방이 많은 노력을 들였다고 느끼면, 나도 비슷한 수준으로 응답해야 한다는 심리적 압박을 느낍니다. 이는 인간의 공정성 본능에서 비롯됩니다." :
          "짧고 미완성된 느낌의 대화는 지그닉 효과를 만듭니다. 완결되지 않은 것이 더 기억에 남고 궁금증을 유발합니다. 상대방은 대화를 완성하고 싶은 욕구를 느끼게 됩니다.",
        source: messageLength > 30 ? "Dennis Regan" : "Bluma Zeigarnik"
      },
      {
        theory: "앵커링 효과 (Anchoring Effect)",
        explanation: "첫 인상과 첫 메시지는 앵커링 효과를 만듭니다. 처음 제시된 정보가 이후 모든 판단의 기준점이 됩니다. 따라서 초반 대화의 톤과 태도가 관계 전체의 방향을 크게 좌우합니다.",
        source: "Amos Tversky & Daniel Kahneman"
      }
    ],
    reply_suggestions: [
      {
        option: "공감 + 가벼운 질문",
        what_this_achieves: "대화 주도권을 자연스럽게 가져오고, 상대방과의 친밀도를 한 단계 높일 수 있습니다",
        psychological_effect: "상대방은 '이 사람이 나에게 관심 있구나, 나를 알고 싶어하는구나'라고 느끼게 되어 호감도가 상승합니다. 동시에 자신에 대해 이야기하면서 당신과의 유대감을 느낍니다.",
        exact_examples: [
          "ㅋㅋㅋ 완전 공감ㅠ 너는 그럴 때 어떻게 해?",
          "아 나도 그래ㅋㅋ 근데 너 그런 상황에서 보통 어떤 식으로 대처해?",
          "그러니까ㅋㅋ 나만 그런 게 아니구나. 너는 그럴 때 뭐 하면서 풀어?"
        ],
        how_to_execute: {
          timing: "상대방 메시지 받고 1-3시간 내 (너무 빠르지도, 늦지도 않게)",
          tone: "가볍고 편안하게. 진지하면 부담스러울 수 있음",
          followup: "상대방이 답변하면 경청하고 공감 표시. 추가 질문으로 대화 이어가기"
        },
        theory_basis: "사회침투이론 (Social Penetration Theory)",
        theory_explanation: "관계는 점진적인 자기노출을 통해 깊어집니다. 질문을 통해 상대방의 자기노출을 유도하면서 동시에 공감으로 안전한 분위기를 만들어 관계의 깊이를 한 단계 높일 수 있습니다.",
        pros: "대화를 자연스럽게 이어가고, 상대방에 대해 더 알 수 있음",
        cons: "상대방이 질문에 부담을 느낄 수 있음",
        when_to_use: "상대방이 긍정적이고 대화에 적극적일 때"
      },
      {
        option: "유머 + 공감",
        what_this_achieves: "편안하고 재미있는 사람이라는 인상을 주고, 심리적 거리를 빠르게 좁힐 수 있습니다",
        psychological_effect: "상대방의 경계심을 낮추고, '이 사람과 있으면 편하고 재미있다'는 긍정적 감정을 만듭니다. 유머는 매력도를 크게 높이는 요소입니다.",
        exact_examples: [
          "ㅋㅋㅋㅋ 완전 공감ㅠㅠ 나도 그래서 요즘 멘탈이...😂",
          "진짜? 나도 똑같아ㅋㅋㅋ 우리 케미 대박인듯😆",
          "아 이거 나 얘기인 줄ㅋㅋㅋ 완전 동감이야"
        ],
        how_to_execute: {
          timing: "즉시~1시간 내 (유머는 타이밍이 생명)",
          tone: "재미있고 공감하는 느낌. 이모지 활용",
          followup: "상대방도 웃으면 가볍게 대화 이어가기. 본인 경험 간단히 공유 가능"
        },
        theory_basis: "유사성-매력 가설 (Similarity-Attraction Hypothesis)",
        theory_explanation: "사람들은 자신과 비슷한 경험이나 감정을 가진 사람에게 호감을 느낍니다. 유머로 편안함을 주면서 공통점을 드러내면 상대방이 '이 사람은 나를 이해해'라고 느끼게 됩니다.",
        pros: "편안한 분위기 형성, 친밀감 증가",
        cons: "진지한 대화로 발전하기 어려울 수 있음",
        when_to_use: "가볍고 재미있는 대화를 원할 때"
      },
      {
        option: "공감 + 경험 공유",
        what_this_achieves: "자신을 먼저 드러내어 상대방도 마음을 열게 만들고, 관계를 빠르게 깊게 만들 수 있습니다",
        psychological_effect: "상호 자기노출의 원리로 상대방도 자신의 이야기를 하게 되고, '이 사람은 나를 이해해주는구나'라는 신뢰감이 형성됩니다. 친밀감이 급속도로 상승합니다.",
        exact_examples: [
          "나도 완전 그랬어ㅋㅋ 저번 주에 나도 비슷한 일 있었는데...",
          "아 이해돼. 나도 예전에 그런 적 있어서 그 기분 알아ㅠ",
          "ㅇㅈㅇㅈ. 나는 그때 [구체적 경험] 했었는데 너는 어떻게 했어?"
        ],
        how_to_execute: {
          timing: "1-2시간 내 (생각할 시간 갖고)",
          tone: "진솔하고 공감하는 느낌. 너무 무겁지 않게",
          followup: "자기 경험은 2-3문장 정도만. 그 후 상대방에게 초점 다시 맞추기"
        },
        theory_basis: "자기노출의 상호성 (Self-Disclosure Reciprocity)",
        theory_explanation: "한 사람이 자신의 경험을 공유하면 상대방도 비슷한 수준의 자기노출로 응답하는 경향이 있습니다. 이는 신뢰를 구축하고 관계를 빠르게 친밀하게 만드는 효과적인 방법입니다.",
        pros: "자신을 드러내며 신뢰 형성, 깊은 대화 가능",
        cons: "자칫 자기 얘기만 하는 것처럼 보일 수 있음",
        when_to_use: "관계를 더 깊게 발전시키고 싶을 때"
      }
    ],
    what_do_you_want: {
      question: "이 상황에서 당신이 원하는 결과는 무엇인가요?",
      options: [
        "관계를 더 친밀하게 발전시키고 싶다",
        "상대방의 관심을 더 끌고 싶다",
        "상황의 주도권을 가지고 싶다",
        "자연스럽게 거리를 두고 싶다"
      ],
      note: "원하는 결과에 따라 가장 적합한 전략이 달라집니다"
    },
    warnings: [
      "너무 빠른 답장은 부담스러울 수 있어요. 상대방의 답장 속도에 맞춰보세요.",
      "과도한 질문은 심문처럼 느껴질 수 있습니다. 자연스러운 대화 흐름을 유지하세요.",
      "이모지와 'ㅋㅋ'를 너무 많이 사용하면 진지함이 떨어질 수 있어요."
    ],
    behavior_evaluation: {
      healthy_signs: interestScore > 60 ? [
        "적절한 답장 길이 - 대화에 성의를 보이고 있습니다",
        hasEmoji ? "이모지 사용 - 편안함과 친근함을 표현하고 있습니다" : "정중한 태도를 유지하고 있습니다",
        "질문이나 대화 지속 의지가 보입니다"
      ] : [
        "최소한의 예의는 지키고 있습니다"
      ],
      concerning_signs: interestScore < 40 ? [
        "답장이 지나치게 짧거나 성의가 없어 보입니다",
        "대화를 이어가려는 노력이 부족해 보입니다",
        "감정 표현이 거의 없어 관심도를 파악하기 어렵습니다"
      ] : messageLength < 10 ? [
        "답장이 다소 짧은 편입니다 - 바쁘거나 아직 친밀도가 낮을 수 있습니다"
      ] : [],
      red_flags: [],
      boundary_guide: interestScore > 70 ? 
        "현재는 건강한 수준의 대화입니다. 상대방도 긍정적으로 반응하고 있으니 자연스럽게 관계를 발전시켜 나가세요. 단, 일방적인 관심이 되지 않도록 상대방의 반응을 계속 확인하세요." :
        interestScore > 40 ?
        "아직 친밀도가 높지 않은 단계입니다. 너무 빠르게 친해지려 하거나 과도한 관심을 보이면 부담스러울 수 있으니, 천천히 신뢰를 쌓아가세요. 상대방이 먼저 대화를 시작하거나 질문을 할 때까지 기다려보는 것도 좋습니다." :
        "관심도가 낮은 편입니다. 일방적으로 노력하지 마세요. 2-3번 시도해도 반응이 냉담하다면 잠시 거리를 두고, 상대방이 먼저 연락할 기회를 주는 것이 좋습니다. 자존감을 지키는 것이 중요합니다."
    },
    overall_advice: `관심도 ${interestScore}%로 ${interestScore > 70 ? '매우 긍정적' : interestScore > 50 ? '중간' : '조금 소극적'}인 신호를 보이고 있습니다. ${interestScore > 70 ? '좋은 흐름이니 자연스럽게 대화를 이어가세요.' : '부담 주지 않는 선에서 관심을 표현해보세요.'} 심리학적으로 상호성의 원리에 따라, 상대방의 에너지와 비슷한 수준으로 반응하는 것이 좋습니다.`,
    three_line_summary: [
      interestScore > 70 ? "긍정적 신호 확인. 관계 발전 가능성 높음" : interestScore > 40 ? "중립적 신호. 천천히 접근 필요" : "소극적 신호. 일방적 노력 지양",
      interestScore > 70 ? "가볍게 공감하고 질문으로 대화 이어가기" : interestScore > 40 ? "부담 주지 말고 상대방 페이스에 맞추기" : "2-3번 시도 후 반응 없으면 거리두기",
      "상대방 답장 속도·길이에 맞춰 반응하기. 일방적 집착 금물"
    ]
  };
};

// 고민 상담 데모 데이터
const getDemoConcernAnalysis = (concern) => {
  return {
    confidence_level: "중간",
    situation_summary: "연애와 관련된 고민을 겪고 계시는군요. 이런 감정은 매우 자연스럽습니다.",
    what_do_you_want: {
      question: "이 고민에서 당신이 진짜 원하는 것은 무엇인가요?",
      options: [
        "관계를 개선하고 싶다",
        "상대방이 변화하길 바란다",
        "내 마음의 평화를 찾고 싶다",
        "관계를 정리할지 판단하고 싶다"
      ],
      note: "원하는 결과에 따라 접근 방법이 완전히 달라집니다"
    },
    your_emotional_state: {
      dominant_emotions: "불안, 혼란, 좌절, 그리고 동시에 상대방에 대한 애정과 기대가 공존하고 있을 것입니다",
      emotional_needs: "관계에 대한 확신, 안정감, 상대방으로부터의 명확한 신호, 그리고 자신의 감정이 이해받는 느낌을 원하고 있습니다"
    },
    root_cause_analysis: {
      evolutionary_perspective: "진화심리학적으로 인간은 장기적 파트너 선택이 생존과 번식에 직결되었습니다. 배우자 선택의 불확실성은 본능적으로 강한 불안을 유발합니다. 수렵채집 시대, 잘못된 파트너 선택은 자원 부족과 생존 위협으로 이어졌기 때문에, 우리 뇌는 연애 관계에서 미세한 신호도 과도하게 분석하도록 진화했습니다.",
      psychological_patterns: "이 고민은 불안정 애착 패턴과 연관될 수 있습니다. 어린 시절 양육자와의 관계에서 형성된 애착 스타일이 현재 연애 관계에 투사되고 있을 가능성이 있습니다. 또한 '재앙화(catastrophizing)' 같은 인지 왜곡이 작동해 작은 문제를 과장하거나, '전부 아니면 전무(all-or-nothing)' 사고로 관계를 극단적으로 해석할 수 있습니다.",
      underlying_needs: "근본적으로는 '사랑받고 싶은 욕구'와 '버림받을 두려움' 사이의 갈등입니다. 안정적인 애착과 소속감을 원하지만, 동시에 상처받거나 거절당할까봐 두려워합니다. 자기가치감이 낮을 경우, 상대방의 사랑으로 자신의 가치를 증명받으려는 무의식적 욕구가 작동할 수 있습니다."
    },
    psychology_basis: [
      {
        theory: "애착이론 (Attachment Theory)",
        explanation: "연애 관계에서의 불안은 과거의 애착 경험과 관련이 있을 수 있습니다. 안정적인 애착을 형성하기 위해서는 자신의 감정을 솔직하게 표현하고 상대방과의 소통이 중요합니다.",
        source: "John Bowlby, Mary Ainsworth"
      },
      {
        theory: "자기결정이론 (Self-Determination Theory)",
        explanation: "건강한 관계는 자율성, 유능성, 관계성의 세 가지 기본 욕구가 충족될 때 형성됩니다. 자신의 가치관과 필요를 명확히 하는 것이 중요합니다.",
        source: "Deci & Ryan"
      }
    ],
    solutions: [
      {
        solution: "솔직한 대화 시도",
        what_this_achieves: "오해를 해소하고 관계의 투명성을 높여, 서로에 대한 이해와 신뢰를 회복할 수 있습니다",
        psychological_effect: "정서중심치료(EFT)에 따르면, 진짜 감정을 표현하면 상대방도 방어를 내리고 진심으로 연결됩니다. 기분 나쁘지 않게 상대방이 자신을 되돌아보게 만드는 가장 효과적인 방법입니다.",
        step_by_step: [
          "1단계: 조용하고 편안한 시간과 장소 정하기 (카페, 산책, 집 등)",
          "2단계: '나-전달법'으로 감정 표현 ('너는~' 대신 '나는 ~할 때 ~한 느낌이 들어')",
          "3단계: 상대방 반응 경청하고, 함께 해결 방법 찾기"
        ],
        exact_script: "나 요즘 우리 관계에 대해 생각이 많아. 5분만 내 얘기 들어줄 수 있어? 비난하려는 게 아니라, 내 솔직한 감정을 나누고 싶어. 나는 [구체적 상황]할 때 [감정]을 느꼈거든. 우리 이 부분에 대해 같이 얘기해볼 수 있을까?",
        practical_tips: [
          "타이밍: 둘 다 여유 있고 기분 좋을 때. 피곤하거나 스트레스 받을 때는 피하기",
          "장소: 공공장소가 오히려 편할 수 있음 (감정이 격해지는 것 방지)",
          "태도: 비난 금지. '우리'가 함께 해결할 문제로 프레임",
          "준비: 핵심 감정 2-3가지만 미리 정리해두기"
        ],
        theory_basis: "정서중심치료 (EFT - Emotionally Focused Therapy)",
        theory_explanation: "EFT는 감정을 회피하지 않고 직접 표현하고 소통하는 것이 관계 개선의 핵심이라고 봅니다. 자신의 진짜 감정을 드러내면 상대방도 방어벽을 내리고 진정한 연결이 가능해집니다.",
        pros: "오해를 해소하고 서로를 더 잘 이해할 수 있음. 관계의 투명성이 높아짐",
        cons: "처음에는 어색하고 불편할 수 있음. 상대방의 반응을 예측할 수 없음",
        when_to_use: "관계에 대한 불확실성이 클 때, 오해가 쌓이고 있다고 느낄 때"
      },
      {
        solution: "시간을 두고 관찰",
        what_this_achieves: "감정에 휘둘리지 않고 객관적으로 상황을 판단할 수 있게 되며, 올바른 결정을 내릴 수 있습니다",
        psychological_effect: "인지행동치료(CBT)의 핵심인 '사고-감정-행동'의 연결고리를 끊습니다. 충동적 반응 대신 합리적 판단을 하게 되고, 자동적 사고 왜곡(예: 과잉 일반화, 재앙화)을 식별할 수 있습니다.",
        step_by_step: [
          "1단계: 2주 동안 상대방 행동 패턴 기록 (스마트폰 메모 활용)",
          "2단계: 매일 5분씩 자신의 감정 일기 쓰기 (왜 불안한지, 무엇을 원하는지)",
          "3단계: 2주 후 패턴 분석 - 일관된 신호인지, 내 감정이 과잉반응인지 판단"
        ],
        exact_script: null,
        practical_tips: [
          "기록 항목: 상대방 연락 빈도, 대화 톤, 만남 제안 여부, 관심 표현 등",
          "감정 일기: '오늘 ~할 때 ~한 감정. 이유는 ~때문인 것 같다'",
          "친구/가족에게 객관적 의견 물어보기 (단, 1-2명만)",
          "이 기간 동안 집착하지 말고 자기 생활에 집중"
        ],
        theory_basis: "인지행동치료 (CBT - Cognitive Behavioral Therapy)",
        theory_explanation: "CBT는 즉각적인 감정 반응보다 객관적 관찰과 사고 패턴 분석을 강조합니다. 시간을 두고 관찰하면 자동적 사고와 왜곡된 인지를 식별하고, 더 합리적인 판단을 할 수 있습니다.",
        pros: "충동적인 결정을 피할 수 있음. 더 객관적인 판단 가능",
        cons: "답답함을 느낄 수 있음. 문제가 악화될 수도 있음",
        when_to_use: "감정이 혼란스러울 때, 상황 판단이 어려울 때"
      },
      {
        solution: "자기 돌봄 우선하기",
        what_this_achieves: "자존감을 회복하고 관계 의존도를 낮춰, 더 건강하고 매력적인 사람이 되어 오히려 관계가 좋아집니다",
        psychological_effect: "자기결정이론(SDT)에 따르면 자율성과 유능성이 충족되면 관계에서도 더 건강해집니다. 역설적이게도 상대방에 덜 집착할수록 상대방이 더 당신을 원하게 됩니다(희소성 원리).",
        step_by_step: [
          "1단계: 일주일에 최소 3번, 자기만의 시간 확보 (취미, 운동, 친구 등)",
          "2단계: 상대방 생각나도 참고, 자기 활동에 집중 (최소 2-3시간)",
          "3단계: 한 달 후 자존감과 관계 만족도 변화 확인"
        ],
        exact_script: null,
        practical_tips: [
          "구체적 활동: 운동, 독서, 친구 만남, 새로운 취미 시도 등",
          "SNS에 자기 활동 올리기 (상대방 의식 X, 자기 기록용)",
          "연락 빈도: 상대방과 50:50 균형 맞추기. 내가 먼저 80%면 줄이기",
          "자기 발전 투자: 외모, 커리어, 지식 등 하나만 선택해 집중"
        ],
        theory_basis: "자기결정이론 (Self-Determination Theory)",
        theory_explanation: "건강한 관계는 자율성, 유능성, 관계성의 균형에서 나옵니다. 자기 자신을 돌보고 성장시키는 것은 자율성과 유능성을 충족시켜 관계에서도 더 건강한 상태를 만듭니다. 의존적인 관계가 아닌 독립적이면서도 친밀한 관계가 가능해집니다.",
        pros: "자존감 향상, 관계 의존도 감소, 더 매력적인 사람이 됨",
        cons: "상대방이 소외감을 느낄 수 있음. 균형 잡기가 어려울 수 있음",
        when_to_use: "관계에 너무 몰입되어 있을 때, 자존감이 낮아졌을 때"
      }
    ],
    warnings: [
      "상대방을 바꾸려 하지 마세요. 변화는 본인이 원할 때만 일어납니다.",
      "자신의 가치관과 경계선을 명확히 하세요. 사랑이라는 이름으로 모든 것을 참을 필요는 없습니다.",
      "레드플래그(폭언, 무시, 통제, 폭력)가 보인다면 관계를 재고해야 합니다."
    ],
    relationship_health_check: {
      healthy_aspects: [
        "문제를 인식하고 해결하려는 의지가 있습니다",
        "자신의 감정과 고민을 솔직하게 드러낼 수 있습니다",
        "관계를 개선하고 싶다는 긍정적인 마음이 있습니다"
      ],
      concerning_aspects: [
        "소통이 원활하지 않거나 오해가 쌓이고 있을 수 있습니다",
        "자존감이 낮아지거나 불안감이 커지고 있습니다",
        "일방적인 희생이나 노력을 하고 있을 가능성이 있습니다"
      ],
      red_flags: [
        "만약 상대방이 폭언, 폭력, 가스라이팅(현실 왜곡), 지속적인 무시를 한다면 즉시 전문가 도움이 필요합니다",
        "경제적 통제, 고립 시도, SNS/전화 감시 등의 행동은 심각한 경고 신호입니다",
        "상대방이 당신의 경계선을 반복적으로 침해하고 사과나 개선 의지가 없다면 관계를 재고해야 합니다"
      ],
      boundary_recommendation: "건강한 관계의 기준: 1) 서로를 존중하고 의견을 경청한다, 2) 각자의 개인 시간과 공간을 인정한다, 3) 감정을 솔직하게 표현할 수 있다, 4) 서로의 성장을 응원한다, 5) 갈등을 건설적으로 해결하려 노력한다. 이 기준에서 크게 벗어난다면 대화를 통해 개선을 시도하되, 변화가 없다면 관계를 재평가해야 합니다. 당신의 행복과 안전이 최우선입니다."
    },
    overall_advice: "연애는 두 사람이 함께 만들어가는 것입니다. 상대방에게만 집중하기보다 자신의 감정과 필요도 돌아보세요. 불안하고 힘든 감정은 자연스러운 것이며, 완벽한 관계는 없습니다. 중요한 것은 서로의 차이를 인정하고 함께 성장하려는 노력입니다. 전문적인 도움이 필요하다고 느껴진다면 상담 전문가를 찾는 것도 좋은 선택입니다.",
    three_line_summary: [
      "연애 불안은 자연스러운 감정. 완벽한 관계는 없음",
      "솔직한 대화로 오해 풀고, 자기 돌봄으로 자존감 회복하기",
      "상대방 바꾸려 하지 말고, 레드플래그 있으면 전문가 도움 받기"
    ]
  };
};
