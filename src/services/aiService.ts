// HerCare AI Healthcare Educational Assistant
// Strict safety & clinical boundaries compliant

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isEmergencyAlert?: boolean;
  suggestedQuestions?: string[];
}

const EMERGENCY_TRIGGER_KEYWORDS = [
  'chest pain',
  'heart attack',
  'stroke',
  'sudden numbness',
  'cannot breathe',
  'severe breathing',
  'shortness of breath',
  'unconscious',
  'coughing blood',
  'heavy bleeding',
  'anaphylaxis',
  'throat swelling',
  'suicide',
  'kill myself',
  'poison',
  'overdose',
  'seizure',
];

export const EDUCATIONAL_TOPICS = [
  {
    topic: 'Understanding PCOS & Hormonal Balance',
    samplePrompt: 'Can you explain Polycystic Ovary Syndrome (PCOS) and typical symptoms in simple terms?',
  },
  {
    topic: 'Preparing for OB/GYN Appointment',
    samplePrompt: 'What questions should I ask my gynecologist about irregular cycles or pelvic pain?',
  },
  {
    topic: 'Iron Deficiency & Nutrition',
    samplePrompt: 'Why is ferritin important for women and what foods or vitamins help absorption?',
  },
  {
    topic: 'Understanding Asthma Management',
    samplePrompt: 'What is the difference between a daily controller inhaler and a rescue inhaler?',
  },
];

export const aiService = {
  isKeyConfigured(): boolean {
    return false; // AI Assistant runs in strictly labeled offline educational demo mode
  },

  /**
   * Evaluates input for critical medical emergency triggers
   */
  checkForEmergency(userInput: string): boolean {
    const lower = userInput.toLowerCase();
    return EMERGENCY_TRIGGER_KEYWORDS.some(kw => lower.includes(kw));
  },

  /**
   * Generates response via intelligent educational rule engine
   * (Maintains strict medical safety guardrails without exposing backend secrets)
   */
  async sendMessage(userInput: string, history: AiChatMessage[]): Promise<AiChatMessage> {
    const isEmergency = this.checkForEmergency(userInput);

    if (isEmergency) {
      return {
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        isEmergencyAlert: true,
        content: `🚨 **IMMEDIATE MEDICAL ATTENTION RECOMMENDED**

Based on the symptoms or emergency keywords detected in your message, **please stop using this app and seek immediate emergency care.**

- **Call 911 (US/Canada), 112 (Europe), 999 (UK), or 108 (India)** immediately.
- If you can safely travel, go to the nearest Emergency Room (ER) or urgent care facility.
- Inform someone nearby or activate your HerCare Emergency SOS card.

*Disclaimer: HerCare AI is an educational assistant and is NOT equipped to diagnose, triage, or treat acute emergencies.*`,
        suggestedQuestions: [
          'Call local emergency services immediately',
          'View my emergency contacts and call',
          'Find nearest emergency room',
        ],
      };
    }

    // Educational Demo Mode (Rule-based triage and doctor consultation prep)
    await new Promise(r => setTimeout(r, 650)); // simulated natural typing cadence

    const lower = userInput.toLowerCase();
    let reply = '';
    let suggested: string[] = [];

    if (lower.includes('pcos') || lower.includes('polycystic') || lower.includes('period') || lower.includes('ovary')) {
      reply = `### Understanding Polycystic Ovary Syndrome (PCOS)

**What is it?**  
PCOS is a common endocrine and metabolic condition affecting women of reproductive age. It is characterized by hormonal imbalances (such as elevated androgen levels), irregular menstrual cycles, and small follicles along the outer edge of the ovaries.

**Common Aspects Discussed with Clinicians:**
- **Cycle Regularity:** Tracking frequency and duration of menstrual cycles.
- **Metabolic Health:** Monitoring insulin sensitivity and lipid panels.
- **Symptom Management:** Addressing mild acne, hirsutism, or fatigue through nutrition and exercise.

**Questions you might ask your doctor:**
1. *Would a pelvic ultrasound or hormone blood panel be helpful for baseline monitoring?*
2. *What dietary approaches (such as low-glycemic eating) do you recommend for insulin stability?*
3. *What cycle tracking metrics should I bring to our next appointment?*`;
      suggested = [
        'How does iron deficiency relate to heavy periods?',
        'What questions should I ask during an ultrasound consult?',
      ];
    } else if (lower.includes('iron') || lower.includes('ferritin') || lower.includes('anemia') || lower.includes('fatigue')) {
      reply = `### Ferritin & Iron Health in Women

**Why is it important?**  
Ferritin is a blood protein that stores iron. Women of reproductive age frequently experience lower iron stores due to menstrual blood loss or dietary factors, which can lead to fatigue, cold intolerance, and brain fog.

**Key Absorption Tips to Discuss with Your Doctor:**
- **Enhancers:** Vitamin C (ascorbic acid) significantly boosts non-heme iron absorption.
- **Inhibitors:** Calcium, dairy, coffee, and tea can impede iron uptake if consumed within 2 hours of iron intake.
- **Gentle Formulations:** If iron supplements cause digestive upset, doctors often suggest specific forms (like ferrous bisglycinate).

**Questions to prepare for your healthcare provider:**
1. *Should we test both serum iron and ferritin levels?*
2. *What is my target ferritin range based on my activity level and symptoms?*`;
      suggested = [
        'What are rich dietary sources of iron?',
        'How often should iron levels be rechecked?',
      ];
    } else if (lower.includes('asthma') || lower.includes('inhaler') || lower.includes('wheez')) {
      reply = `### Inhaler Basics: Controller vs. Rescue

**Key Differences:**
- **Rescue Inhalers (e.g., Albuterol / Ventolin):** Fast-acting bronchodilators used as-needed during acute wheezing, shortness of breath, or immediately before exertion. They quickly relax airway smooth muscles.
- **Controller Inhalers (Inhaled Corticosteroids):** Taken daily on a set schedule to reduce baseline chronic airway inflammation and prevent flare-ups.

**Questions for your Pulmonologist or PCP:**
1. *Does my frequency of rescue inhaler use indicate the need to adjust controller therapy?*
2. *Could you review my inhaler technique to ensure optimal lung deposition?*
3. *Do I need an updated Asthma Action Plan for work or travel?*`;
      suggested = [
        'How do I maintain my inhaler spacer?',
        'What environmental triggers worsen asthma?',
      ];
    } else {
      reply = `### Healthcare Guidance & Consultation Preparation

Thank you for reaching out. As an educational healthcare assistant, I can help you understand medical terminology, organize your symptoms, and prepare targeted questions for your healthcare visit.

**How to structure your upcoming clinical appointment:**
1. **List Your Chief Concern:** Write down the 1–2 main symptoms or questions that matter most to you.
2. **Timeline & Triggers:** When did the symptoms begin? Does anything make them better or worse?
3. **Current Regimen:** Have your complete list of prescription medications, OTC supplements, and known allergies ready.
4. **Clarify Next Steps:** Ask your physician: *"What are the possible causes, what diagnostic tests are recommended, and when should I schedule a follow-up?"*

Feel free to ask me to explain any medical term, test name, or clinical procedure!`;
      suggested = [
        'How do I prepare for an annual well-woman exam?',
        'What should I know about medication interactions?',
        'Explain common blood test acronyms (CMP, CBC, TSH)',
      ];
    }

    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      content: reply + '\n\n*Note: Operating in HerCare Educational Guidance Mode. Not a substitute for a licensed healthcare professional.*',
      suggestedQuestions: suggested,
    };
  },
};
