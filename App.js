import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { analyzeMessage } from './aiService';

export default function App() {
  const [mode, setMode] = useState('message'); // 'message' or 'concern'
  const [message, setMessage] = useState('');
  const [myMBTI, setMyMBTI] = useState('');
  const [theirMBTI, setTheirMBTI] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remainingUses, setRemainingUses] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const mbtiOptions = [
    '', 'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  const API_BASE = 'https://my-love-coach-api.onrender.com';

  const handleFeedbackSubmit = async () => {
    if (feedbackRating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: feedbackRating, text: feedbackText })
      });
      setFeedbackSubmitted(true);
      setTimeout(() => setShowFeedback(false), 2000);
    } catch (e) {
      alert('피드백 전송 중 오류가 발생했습니다.');
    }
  };

  const handleAnalyze = async () => {
    if (!message.trim()) {
      alert('내용을 입력해주세요!');
      return;
    }

    if (loading) {
      return; // 이미 로딩 중이면 중복 요청 방지
    }

    setLoading(true);
    
    try {
      const result = await analyzeMessage(message, mode, myMBTI, theirMBTI);
      setAnalysis(result.data);
      setRemainingUses(result.remaining);
      // 횟수 소진 시 피드백 모달 표시
      if (result.remaining === 0) {
        setTimeout(() => setShowFeedback(true), 1500);
      }
    } catch (error) {
      // 사용자에게 정확한 에러 메시지 표시
      if (error.message) {
        alert(error.message);
      } else {
        alert('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* 피드백 모달 */}
      <Modal
        visible={showFeedback}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFeedback(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {feedbackSubmitted ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 40 }}>🎉</Text>
                <Text style={styles.modalTitle}>감사합니다!</Text>
                <Text style={styles.modalSubtitle}>소중한 의견이 전달됐어요 💌</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>오늘 횟수를 다 쓰셨어요!</Text>
                <Text style={styles.modalSubtitle}>서비스가 도움이 됐나요? 한 줄 피드백 부탁드려요 🙏</Text>
                <View style={styles.starRow}>
                  {[1,2,3,4,5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setFeedbackRating(star)}>
                      <Text style={{ fontSize: 36, opacity: feedbackRating >= star ? 1 : 0.3 }}>⭐</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="어떤 점이 좋았나요? 아쉬운 점은요? (선택)"
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity style={styles.feedbackBtn} onPress={handleFeedbackSubmit}>
                  <Text style={styles.feedbackBtnText}>피드백 보내기 💌</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFeedback(false)}>
                  <Text style={styles.modalSkip}>나중에 할게요</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>💬 연애 AI 코치</Text>
        <Text style={styles.subtitle}>심리학 기반 과학적 분석</Text>
        {remainingUses !== null && (
          <View style={styles.usageBadge}>
            <Text style={styles.usageText}>오늘 남은 횟수: {remainingUses}회</Text>
          </View>
        )}
        
        {/* 모드 선택 */}
        <View style={styles.modeContainer}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'message' && styles.modeButtonActive]}
            onPress={() => setMode('message')}
          >
            <Text style={[styles.modeButtonText, mode === 'message' && styles.modeButtonTextActive]}>
              💬 메시지 분석
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'concern' && styles.modeButtonActive]}
            onPress={() => setMode('concern')}
          >
            <Text style={[styles.modeButtonText, mode === 'concern' && styles.modeButtonTextActive]}>
              🤔 고민 상담
            </Text>
          </TouchableOpacity>
        </View>

        {/* MBTI 입력 */}
        <View style={styles.mbtiContainer}>
          <View style={styles.mbtiRow}>
            <View style={styles.mbtiItem}>
              <Text style={styles.mbtiLabel}>내 MBTI</Text>
              <View style={styles.pickerContainer}>
                <select 
                  style={styles.picker}
                  value={myMBTI}
                  onChange={(e) => setMyMBTI(e.target.value)}
                >
                  <option value="">선택</option>
                  {mbtiOptions.slice(1).map(mbti => (
                    <option key={mbti} value={mbti}>{mbti}</option>
                  ))}
                </select>
              </View>
            </View>
            
            <View style={styles.mbtiItem}>
              <Text style={styles.mbtiLabel}>상대 MBTI</Text>
              <View style={styles.pickerContainer}>
                <select 
                  style={styles.picker}
                  value={theirMBTI}
                  onChange={(e) => setTheirMBTI(e.target.value)}
                >
                  <option value="">선택</option>
                  {mbtiOptions.slice(1).map(mbti => (
                    <option key={mbti} value={mbti}>{mbti}</option>
                  ))}
                </select>
              </View>
            </View>
          </View>
          <Text style={styles.mbtiNote}>💡 선택사항: MBTI를 입력하면 더 맞춤형 조언을 받을 수 있어요</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {mode === 'message' ? '받은 메시지' : '고민 내용'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              mode === 'message' 
                ? '상대방이 보낸 메시지를 입력하세요...'
                : '연애 고민을 자유롭게 적어주세요...'
            }
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'message' ? '🔍 심리 분석하기' : '💡 조언 받기'}
            </Text>
          )}
        </TouchableOpacity>

        {analysis && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✨ 분석 결과</Text>
            
            {/* 확신도 표시 */}
            {analysis.confidence_level && (
              <View style={[
                styles.confidenceBadge, 
                analysis.confidence_level === '높음' && styles.confidenceHigh,
                analysis.confidence_level === '중간' && styles.confidenceMedium,
                analysis.confidence_level === '낮음' && styles.confidenceLow
              ]}>
                <Text style={styles.confidenceText}>
                  분석 확신도: {analysis.confidence_level}
                </Text>
              </View>
            )}

            {/* 상대방 프로필 (메시지 모드) */}
            {mode === 'message' && analysis.their_profile && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 상대방 분석</Text>
                
                {analysis.their_profile.personality_traits && (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>성격 특징 (확실한 것만)</Text>
                    <Text style={styles.resultValue}>{analysis.their_profile.personality_traits}</Text>
                  </View>
                )}

                {analysis.their_profile.communication_style && (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>대화 스타일</Text>
                    <Text style={styles.resultValue}>{analysis.their_profile.communication_style}</Text>
                  </View>
                )}

                {analysis.their_profile.uncertainty_note && (
                  <View style={styles.uncertaintyNote}>
                    <Text style={styles.uncertaintyText}>💭 {analysis.their_profile.uncertainty_note}</Text>
                  </View>
                )}
              </View>
            )}

            {/* 당신의 감정 상태 */}
            {analysis.your_emotional_state && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💙 당신의 감정</Text>
                
                {mode === 'message' && analysis.your_emotional_state.current_feelings && (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>지금 느끼는 감정</Text>
                    <Text style={styles.resultValue}>{analysis.your_emotional_state.current_feelings}</Text>
                  </View>
                )}

                {mode === 'message' && analysis.your_emotional_state.why_you_care && (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>왜 이게 신경 쓰일까?</Text>
                    <Text style={styles.resultValue}>{analysis.your_emotional_state.why_you_care}</Text>
                  </View>
                )}

                {mode === 'concern' && analysis.your_emotional_state.dominant_emotions && (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>주요 감정</Text>
                    <Text style={styles.resultValue}>{analysis.your_emotional_state.dominant_emotions}</Text>
                  </View>
                )}

                {mode === 'concern' && analysis.your_emotional_state.emotional_needs && (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>진짜 원하는 것</Text>
                    <Text style={styles.resultValue}>{analysis.your_emotional_state.emotional_needs}</Text>
                  </View>
                )}
              </View>
            )}
            
            {/* 기본 분석 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 기본 분석</Text>
              
              {mode === 'message' && (
                <>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>감정 상태</Text>
                    <Text style={styles.resultValue}>{analysis.emotion}</Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>관심도</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${analysis.interest_level}%` }]} />
                    </View>
                    <Text style={styles.resultValue}>{analysis.interest_level}% - {analysis.interest_analysis}</Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>애착 유형 (추정)</Text>
                    <Text style={styles.resultValue}>{analysis.attachment_style}</Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>관계 단계</Text>
                    <Text style={styles.resultValue}>{analysis.relationship_stage}</Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>대화 톤</Text>
                    <Text style={styles.resultValue}>{analysis.tone_analysis}</Text>
                  </View>
                </>
              )}

              {mode === 'concern' && analysis.situation_summary && (
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>상황 요약</Text>
                  <Text style={styles.resultValue}>{analysis.situation_summary}</Text>
                </View>
              )}
            </View>

            {/* 행동/고민의 근본 원인 분석 */}
            {mode === 'message' && analysis.behavior_analysis && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧬 왜 이런 행동을 할까요?</Text>
                
                <View style={styles.rootCauseCard}>
                  <Text style={styles.rootCauseTitle}>🦴 진화심리학적 관점</Text>
                  <Text style={styles.rootCauseText}>{analysis.behavior_analysis.evolutionary_perspective}</Text>
                </View>

                <View style={styles.rootCauseCard}>
                  <Text style={styles.rootCauseTitle}>🧠 심리학적 동기</Text>
                  <Text style={styles.rootCauseText}>{analysis.behavior_analysis.psychological_motivation}</Text>
                </View>

                <View style={styles.rootCauseCard}>
                  <Text style={styles.rootCauseTitle}>💭 무의식적 욕구</Text>
                  <Text style={styles.rootCauseText}>{analysis.behavior_analysis.unconscious_needs}</Text>
                </View>
              </View>
            )}

            {mode === 'concern' && analysis.root_cause_analysis && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧬 고민의 뿌리 분석</Text>
                
                <View style={styles.rootCauseCard}>
                  <Text style={styles.rootCauseTitle}>🦴 진화심리학적 뿌리</Text>
                  <Text style={styles.rootCauseText}>{analysis.root_cause_analysis.evolutionary_perspective}</Text>
                </View>

                <View style={styles.rootCauseCard}>
                  <Text style={styles.rootCauseTitle}>🧠 심리 패턴</Text>
                  <Text style={styles.rootCauseText}>{analysis.root_cause_analysis.psychological_patterns}</Text>
                </View>

                <View style={styles.rootCauseCard}>
                  <Text style={styles.rootCauseTitle}>💭 근본적 욕구와 두려움</Text>
                  <Text style={styles.rootCauseText}>{analysis.root_cause_analysis.underlying_needs}</Text>
                </View>
              </View>
            )}

            {/* 심리학적 근거 */}
            {analysis.psychology_basis && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📖 심리학적 근거</Text>
                {analysis.psychology_basis.map((basis, index) => (
                  <View key={index} style={styles.basisCard}>
                    <Text style={styles.basisTheory}>{basis.theory}</Text>
                    <Text style={styles.basisExplanation}>{basis.explanation}</Text>
                    <Text style={styles.basisSource}>출처: {basis.source}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 사용자 목표 질문 */}
            {analysis.what_do_you_want && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 먼저 질문!</Text>
                <View style={styles.goalBox}>
                  <Text style={styles.goalQuestion}>{analysis.what_do_you_want.question}</Text>
                  {analysis.what_do_you_want.options && (
                    <View style={styles.goalOptions}>
                      {analysis.what_do_you_want.options.map((option, idx) => (
                        <Text key={idx} style={styles.goalOption}>• {option}</Text>
                      ))}
                    </View>
                  )}
                  {analysis.what_do_you_want.note && (
                    <Text style={styles.goalNote}>💡 {analysis.what_do_you_want.note}</Text>
                  )}
                </View>
              </View>
            )}

            {/* 답장 제안 또는 해결 방안 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {mode === 'message' ? '💬 답장 제안 (3가지 옵션)' : '💡 해결 방안'}
              </Text>
              {(analysis.reply_suggestions || analysis.solutions || []).map((item, index) => (
                <View key={index} style={styles.suggestionCard}>
                  <Text style={styles.suggestionNumber}>
                    {mode === 'message' ? `옵션 ${index + 1}` : `방법 ${index + 1}`}
                  </Text>
                  <Text style={styles.suggestionOption}>{item.option || item.solution}</Text>
                  
                  {/* 이 방법의 효과 */}
                  {(item.what_this_achieves || item.psychological_effect) && (
                    <View style={styles.effectBox}>
                      {item.what_this_achieves && (
                        <View style={styles.effectItem}>
                          <Text style={styles.effectLabel}>🎯 얻을 수 있는 결과</Text>
                          <Text style={styles.effectText}>{item.what_this_achieves}</Text>
                        </View>
                      )}
                      {item.psychological_effect && (
                        <View style={styles.effectItem}>
                          <Text style={styles.effectLabel}>🧠 심리적 영향</Text>
                          <Text style={styles.effectText}>{item.psychological_effect}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* 정확한 예시 문장 (메시지 모드) */}
                  {mode === 'message' && item.exact_examples && (
                    <View style={styles.examplesBox}>
                      <Text style={styles.examplesTitle}>📝 복붙 가능한 예시</Text>
                      {item.exact_examples.map((example, idx) => (
                        <View key={idx} style={styles.exampleItem}>
                          <Text style={styles.exampleNumber}>{idx + 1}.</Text>
                          <Text style={styles.exampleText}>"{example}"</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 실행 방법 (메시지 모드) */}
                  {mode === 'message' && item.how_to_execute && (
                    <View style={styles.howToBox}>
                      <Text style={styles.howToTitle}>⚡ 실행 가이드</Text>
                      <Text style={styles.howToItem}>⏰ 타이밍: {item.how_to_execute.timing}</Text>
                      <Text style={styles.howToItem}>🎯 톤: {item.how_to_execute.tone}</Text>
                      {item.how_to_execute.followup && (
                        <Text style={styles.howToItem}>💬 후속 대응: {item.how_to_execute.followup}</Text>
                      )}
                    </View>
                  )}

                  {/* 단계별 가이드 (고민 모드) */}
                  {mode === 'concern' && item.step_by_step && (
                    <View style={styles.stepsBox}>
                      <Text style={styles.stepsTitle}>📋 단계별 실행</Text>
                      {item.step_by_step.map((step, idx) => (
                        <Text key={idx} style={styles.stepText}>{step}</Text>
                      ))}
                    </View>
                  )}

                  {/* 정확한 스크립트 (고민 모드) */}
                  {mode === 'concern' && item.exact_script && (
                    <View style={styles.scriptBox}>
                      <Text style={styles.scriptTitle}>💬 대화 스크립트</Text>
                      <Text style={styles.scriptText}>"{item.exact_script}"</Text>
                    </View>
                  )}

                  {/* 실용 팁 (고민 모드) */}
                  {mode === 'concern' && item.practical_tips && (
                    <View style={styles.tipsBox}>
                      <Text style={styles.tipsTitle}>💡 실용 팁</Text>
                      {item.practical_tips.map((tip, idx) => (
                        <Text key={idx} style={styles.tipText}>• {tip}</Text>
                      ))}
                    </View>
                  )}
                  
                  {/* 심리학 이론 근거 */}
                  {item.theory_basis && (
                    <View style={styles.theoryBox}>
                      <Text style={styles.theoryBasis}>🧠 {item.theory_basis}</Text>
                      <Text style={styles.theoryExplanation}>{item.theory_explanation}</Text>
                    </View>
                  )}
                  
                  <View style={styles.prosConsContainer}>
                    <View style={styles.prosConsItem}>
                      <Text style={styles.prosConsLabel}>✅ 장점</Text>
                      <Text style={styles.prosConsText}>{item.pros}</Text>
                    </View>
                    <View style={styles.prosConsItem}>
                      <Text style={styles.prosConsLabel}>⚠️ 단점</Text>
                      <Text style={styles.prosConsText}>{item.cons}</Text>
                    </View>
                  </View>
                  <Text style={styles.whenToUse}>💡 {item.when_to_use}</Text>
                </View>
              ))}
            </View>

            {/* 행동 평가 / 관계 건강도 체크 */}
            {mode === 'message' && analysis.behavior_evaluation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 행동 평가 - 어디까지 괜찮을까?</Text>
                
                {analysis.behavior_evaluation.healthy_signs && analysis.behavior_evaluation.healthy_signs.length > 0 && (
                  <View style={styles.evaluationBox}>
                    <Text style={styles.evaluationTitle}>✅ 건강한 신호</Text>
                    {analysis.behavior_evaluation.healthy_signs.map((sign, index) => (
                      <Text key={index} style={styles.healthyText}>• {sign}</Text>
                    ))}
                  </View>
                )}

                {analysis.behavior_evaluation.concerning_signs && analysis.behavior_evaluation.concerning_signs.length > 0 && (
                  <View style={styles.evaluationBox}>
                    <Text style={styles.evaluationTitle}>⚠️ 주의가 필요한 행동</Text>
                    {analysis.behavior_evaluation.concerning_signs.map((sign, index) => (
                      <Text key={index} style={styles.concerningText}>• {sign}</Text>
                    ))}
                  </View>
                )}

                {analysis.behavior_evaluation.red_flags && analysis.behavior_evaluation.red_flags.length > 0 && (
                  <View style={styles.evaluationBox}>
                    <Text style={styles.evaluationTitle}>🚩 레드플래그 (절대 안 됨)</Text>
                    {analysis.behavior_evaluation.red_flags.map((flag, index) => (
                      <Text key={index} style={styles.redFlagText}>• {flag}</Text>
                    ))}
                  </View>
                )}

                {analysis.behavior_evaluation.boundary_guide && (
                  <View style={styles.boundaryBox}>
                    <Text style={styles.boundaryTitle}>📏 경계선 가이드</Text>
                    <Text style={styles.boundaryText}>{analysis.behavior_evaluation.boundary_guide}</Text>
                  </View>
                )}
              </View>
            )}

            {mode === 'concern' && analysis.relationship_health_check && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💚 관계 건강도 체크</Text>
                
                {analysis.relationship_health_check.healthy_aspects && analysis.relationship_health_check.healthy_aspects.length > 0 && (
                  <View style={styles.evaluationBox}>
                    <Text style={styles.evaluationTitle}>✅ 건강한 면</Text>
                    {analysis.relationship_health_check.healthy_aspects.map((aspect, index) => (
                      <Text key={index} style={styles.healthyText}>• {aspect}</Text>
                    ))}
                  </View>
                )}

                {analysis.relationship_health_check.concerning_aspects && analysis.relationship_health_check.concerning_aspects.length > 0 && (
                  <View style={styles.evaluationBox}>
                    <Text style={styles.evaluationTitle}>⚠️ 우려되는 부분</Text>
                    {analysis.relationship_health_check.concerning_aspects.map((aspect, index) => (
                      <Text key={index} style={styles.concerningText}>• {aspect}</Text>
                    ))}
                  </View>
                )}

                {analysis.relationship_health_check.red_flags && analysis.relationship_health_check.red_flags.length > 0 && (
                  <View style={styles.evaluationBox}>
                    <Text style={styles.evaluationTitle}>🚩 심각한 문제 신호</Text>
                    {analysis.relationship_health_check.red_flags.map((flag, index) => (
                      <Text key={index} style={styles.redFlagText}>• {flag}</Text>
                    ))}
                  </View>
                )}

                {analysis.relationship_health_check.boundary_recommendation && (
                  <View style={styles.boundaryBox}>
                    <Text style={styles.boundaryTitle}>📏 경계선 권장사항</Text>
                    <Text style={styles.boundaryText}>{analysis.relationship_health_check.boundary_recommendation}</Text>
                  </View>
                )}
              </View>
            )}

            {/* 주의사항 */}
            {analysis.warnings && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ 주의사항</Text>
                {analysis.warnings.map((warning, index) => (
                  <View key={index} style={styles.warningItem}>
                    <Text style={styles.warningText}>• {warning}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 전체 조언 */}
            <View style={[styles.section, styles.adviceSection]}>
              <Text style={styles.sectionTitle}>💡 전체 조언</Text>
              <Text style={styles.adviceText}>{analysis.overall_advice}</Text>
            </View>

            {/* 세줄요약 */}
            {analysis.three_line_summary && (
              <View style={[styles.section, styles.summarySection]}>
                <Text style={styles.sectionTitle}>📌 세줄요약</Text>
                {analysis.three_line_summary.map((line, index) => (
                  <View key={index} style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>{index + 1}</Text>
                    <Text style={styles.summaryText}>{line}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  modeButtonActive: {
    backgroundColor: '#F0E7FF',
    borderColor: '#6C5CE7',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#6C5CE7',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginBottom: 30,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C5CE7',
    marginBottom: 15,
  },
  resultItem: {
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: 5,
  },
  basisCard: {
    backgroundColor: '#F8F7FF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6C5CE7',
  },
  basisTheory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C5CE7',
    marginBottom: 8,
  },
  basisExplanation: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  basisSource: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  suggestionCard: {
    backgroundColor: '#F0FFF4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  suggestionNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38A169',
    marginBottom: 8,
  },
  suggestionOption: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  theoryBox: {
    backgroundColor: '#E6F3FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2B6CB0',
  },
  theoryBasis: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B6CB0',
    marginBottom: 6,
  },
  theoryExplanation: {
    fontSize: 13,
    color: '#2C5282',
    lineHeight: 19,
  },
  prosConsContainer: {
    marginBottom: 10,
  },
  prosConsItem: {
    marginBottom: 8,
  },
  prosConsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  prosConsText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  whenToUse: {
    fontSize: 13,
    color: '#38A169',
    fontStyle: 'italic',
  },
  warningItem: {
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#E53E3E',
    lineHeight: 20,
  },
  adviceSection: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  adviceText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  rootCauseCard: {
    backgroundColor: '#FFF8E7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  rootCauseTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  rootCauseText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 21,
  },
  evaluationBox: {
    marginBottom: 15,
  },
  evaluationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  healthyText: {
    fontSize: 14,
    color: '#059669',
    lineHeight: 22,
    marginBottom: 6,
  },
  concerningText: {
    fontSize: 14,
    color: '#D97706',
    lineHeight: 22,
    marginBottom: 6,
  },
  redFlagText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 22,
    marginBottom: 6,
    fontWeight: '600',
  },
  boundaryBox: {
    backgroundColor: '#EEF2FF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  boundaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4338CA',
    marginBottom: 8,
  },
  boundaryText: {
    fontSize: 14,
    color: '#3730A3',
    lineHeight: 21,
  },
  confidenceBadge: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  confidenceHigh: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  confidenceMedium: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  confidenceLow: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  uncertaintyNote: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  uncertaintyText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  examplesBox: {
    backgroundColor: '#F0FDF4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 10,
  },
  exampleItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  exampleNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#15803D',
    marginRight: 6,
  },
  exampleText: {
    fontSize: 13,
    color: '#166534',
    flex: 1,
    lineHeight: 20,
  },
  howToBox: {
    backgroundColor: '#FEF9C3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  howToTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#854D0E',
    marginBottom: 8,
  },
  howToItem: {
    fontSize: 12,
    color: '#713F12',
    marginBottom: 4,
  },
  stepsBox: {
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 10,
  },
  stepText: {
    fontSize: 13,
    color: '#1E3A8A',
    marginBottom: 8,
    lineHeight: 20,
  },
  scriptBox: {
    backgroundColor: '#F5F3FF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  scriptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5B21B6',
    marginBottom: 8,
  },
  scriptText: {
    fontSize: 13,
    color: '#6B21A8',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  tipsBox: {
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#9A3412',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#7C2D12',
    marginBottom: 4,
    lineHeight: 18,
  },
  goalBox: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  goalQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 12,
  },
  goalOptions: {
    marginBottom: 10,
  },
  goalOption: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 6,
    lineHeight: 20,
  },
  goalNote: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
    marginTop: 8,
  },
  effectBox: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  effectItem: {
    marginBottom: 8,
  },
  effectLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  effectText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 19,
  },
  mbtiContainer: {
    marginBottom: 20,
  },
  mbtiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mbtiItem: {
    flex: 1,
  },
  mbtiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  mbtiNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  summarySection: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginRight: 10,
    minWidth: 25,
  },
  summaryText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    flex: 1,
    fontWeight: '600',
  },
  usageBadge: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  usageText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  feedbackInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 80,
  },
  feedbackBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSkip: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'underline',
  },
});
