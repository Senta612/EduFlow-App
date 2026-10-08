// WhatsApp Message Formatters for Local Tuition Classes (Multilingual: en, hi, gu)

export function formatStudentProgressWhatsAppMessage(params: {
  studentName: string;
  rollNumber: string;
  batchName: string;
  instituteName?: string;
  teacherName?: string;
  periodName?: string;
  overallGrade?: string;
  attendancePercentage: number;
  totalClassesAttended: number;
  totalClasses: number;
  hwCompletionPercentage: number;
  hwDoneCount?: number;
  hwTotal?: number;
  averageTestPercentage?: number;
  testsAttempted?: number;
  batchRank?: number;
  totalStudentsInBatch?: number;
  latestTest?: { title: string; marksObtained: number; maxMarks: number; rank?: number };
  nextMonthFocus?: string;
  remarks?: string;
  language?: 'en' | 'hi' | 'gu';
}): string {
  const lang = params.language || 'en';
  const institute = params.instituteName?.trim() || 'EduFlow Tuition Academy';
  const period = params.periodName?.trim() || 'Monthly Progress Report';

  if (lang === 'gu') {
    const lines = [
      `🏫 *${institute.toUpperCase()}*`,
      `📑 *વિદ્યાર્થી માસિક પ્રગતિ પત્રક* (${period})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *વિદ્યાર્થી:* ${params.studentName}`,
      `🔢 *રોલ નં:* #${params.rollNumber} | 🏷️ *બેચ:* ${params.batchName}`,
    ];

    if (params.overallGrade) {
      lines.push(`🏅 *સમગ્ર પ્રદર્શન ગ્રેડ:* ${params.overallGrade}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📅 *હાજરી પત્રક:* ${params.attendancePercentage}%`);
    lines.push(`   (${params.totalClassesAttended}/${params.totalClasses} દિવસો હાજર)`);

    const hwCountStr = params.hwTotal !== undefined ? ` (${params.hwDoneCount || 0}/${params.hwTotal} લેસન)` : '';
    lines.push(`📝 *હોમવર્ક નિયમિતતા:* ${params.hwCompletionPercentage}% પૂર્ણ${hwCountStr}`);

    if (params.averageTestPercentage !== undefined && params.testsAttempted !== undefined && params.testsAttempted > 0) {
      const rankSuffix = params.batchRank
        ? ` | 🏆 રેન્ક: #${params.batchRank}${params.totalStudentsInBatch ? `/${params.totalStudentsInBatch}` : ''}`
        : '';
      lines.push(`🎯 *ટેસ્ટ સરેરાશ:* ${params.averageTestPercentage}% (${params.testsAttempted} ટેસ્ટ)${rankSuffix}`);
    }

    if (params.latestTest) {
      const testPercent =
        params.latestTest.maxMarks > 0
          ? Math.round((params.latestTest.marksObtained / params.latestTest.maxMarks) * 100)
          : 0;
      const rankStr = params.latestTest.rank ? ` [રેન્ક: #${params.latestTest.rank}]` : '';
      lines.push(`📊 *છેલ્લી ટેસ્ટ:* ${params.latestTest.title}`);
      lines.push(`   ગુણ: ${params.latestTest.marksObtained}/${params.latestTest.maxMarks} (${testPercent}%)${rankStr}`);
    }

    if (params.remarks && params.remarks.trim()) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`💬 *શિક્ષકની નોંધ:*`);
      lines.push(`"${params.remarks.trim()}"`);
    }

    if (params.nextMonthFocus && params.nextMonthFocus.trim()) {
      lines.push(`📌 *આવતા મહિનાનું લક્ષ્ય:* ${params.nextMonthFocus.trim()}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    if (params.teacherName) {
      lines.push(`👨‍🏫 *શિક્ષક:* ${params.teacherName}`);
    }
    lines.push(`_આપના સતત સહકાર અને વિશ્વાસ બદલ ખૂબ ખૂબ આભાર!_`);
    return lines.join('\n');
  }

  if (lang === 'hi') {
    const lines = [
      `🏫 *${institute.toUpperCase()}*`,
      `📑 *विद्यार्थी मासिक प्रगति पत्र* (${period})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *विद्यार्थी:* ${params.studentName}`,
      `🔢 *रोल नं:* #${params.rollNumber} | 🏷️ *बैच:* ${params.batchName}`,
    ];

    if (params.overallGrade) {
      lines.push(`🏅 *समग्र प्रदर्शन ग्रेड:* ${params.overallGrade}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📅 *उपस्थिति दर:* ${params.attendancePercentage}%`);
    lines.push(`   (${params.totalClassesAttended}/${params.totalClasses} दिन उपस्थित)`);

    const hwCountStr = params.hwTotal !== undefined ? ` (${params.hwDoneCount || 0}/${params.hwTotal} कार्य)` : '';
    lines.push(`📝 *गृहकार्य नियमितता:* ${params.hwCompletionPercentage}% पूर्ण${hwCountStr}`);

    if (params.averageTestPercentage !== undefined && params.testsAttempted !== undefined && params.testsAttempted > 0) {
      const rankSuffix = params.batchRank
        ? ` | 🏆 रैंक: #${params.batchRank}${params.totalStudentsInBatch ? `/${params.totalStudentsInBatch}` : ''}`
        : '';
      lines.push(`🎯 *टेस्ट औसत:* ${params.averageTestPercentage}% (${params.testsAttempted} टेस्ट)${rankSuffix}`);
    }

    if (params.latestTest) {
      const testPercent =
        params.latestTest.maxMarks > 0
          ? Math.round((params.latestTest.marksObtained / params.latestTest.maxMarks) * 100)
          : 0;
      const rankStr = params.latestTest.rank ? ` [रैंक: #${params.latestTest.rank}]` : '';
      lines.push(`📊 *नवीनतम टेस्ट:* ${params.latestTest.title}`);
      lines.push(`   अंक: ${params.latestTest.marksObtained}/${params.latestTest.maxMarks} (${testPercent}%)${rankStr}`);
    }

    if (params.remarks && params.remarks.trim()) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`💬 *शिक्षक टिप्पणी:*`);
      lines.push(`"${params.remarks.trim()}"`);
    }

    if (params.nextMonthFocus && params.nextMonthFocus.trim()) {
      lines.push(`📌 *आगामी माह का लक्ष्य:* ${params.nextMonthFocus.trim()}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    if (params.teacherName) {
      lines.push(`👨‍🏫 *शिक्षक:* ${params.teacherName}`);
    }
    lines.push(`_आपके निरंतर सहयोग और विश्वास के लिए धन्यवाद!_`);
    return lines.join('\n');
  }

  // English Default
  const lines = [
    `🏫 *${institute.toUpperCase()}*`,
    `📑 *Monthly Student Progress Report* (${period})`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Student:* ${params.studentName}`,
    `🔢 *Roll No:* #${params.rollNumber} | 🏷️ *Batch:* ${params.batchName}`,
  ];

  if (params.overallGrade) {
    lines.push(`🏅 *Overall Grade:* ${params.overallGrade}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📅 *Attendance:* ${params.attendancePercentage}%`);
  lines.push(`   (${params.totalClassesAttended}/${params.totalClasses} classes attended)`);

  const hwCountStr = params.hwTotal !== undefined ? ` (${params.hwDoneCount || 0}/${params.hwTotal} tasks)` : '';
  lines.push(`📝 *Homework Regularity:* ${params.hwCompletionPercentage}% Completed${hwCountStr}`);

  if (params.averageTestPercentage !== undefined && params.testsAttempted !== undefined && params.testsAttempted > 0) {
    const rankSuffix = params.batchRank
      ? ` | 🏆 Rank: #${params.batchRank}${params.totalStudentsInBatch ? `/${params.totalStudentsInBatch}` : ''}`
      : '';
    lines.push(`🎯 *Test Average:* ${params.averageTestPercentage}% (${params.testsAttempted} tests)${rankSuffix}`);
  }

  if (params.latestTest) {
    const testPercent =
      params.latestTest.maxMarks > 0
        ? Math.round((params.latestTest.marksObtained / params.latestTest.maxMarks) * 100)
        : 0;
    const rankStr = params.latestTest.rank ? ` [Rank: #${params.latestTest.rank}]` : '';
    lines.push(`📊 *Latest Test:* ${params.latestTest.title}`);
    lines.push(`   Score: ${params.latestTest.marksObtained}/${params.latestTest.maxMarks} (${testPercent}%)${rankStr}`);
  }

  if (params.remarks && params.remarks.trim()) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💬 *Teacher Remarks:*`);
    lines.push(`"${params.remarks.trim()}"`);
  }

  if (params.nextMonthFocus && params.nextMonthFocus.trim()) {
    lines.push(`📌 *Next Month Focus:* ${params.nextMonthFocus.trim()}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (params.teacherName) {
    lines.push(`👨‍🏫 *Faculty:* ${params.teacherName}`);
  }
  lines.push(`_Thank you for your continuous support & trust!_`);
  return lines.join('\n');
}

export function formatDefaulterWhatsAppMessage(params: {
  studentName: string;
  batchName: string;
  issuesSummary: string;
  language?: 'en' | 'hi' | 'gu';
}): string {
  const lang = params.language || 'en';

  if (lang === 'gu') {
    return [
      `⚠️ *ટ્યુશન ક્લાસ તરફથી મહત્વપૂર્ણ સંદેશ*`,
      `આદરણીય વાલીશ્રી, આ સંદેશ *${params.studentName}* (${params.batchName}) ના અભ્યાસ અંગે છે.`,
      ``,
      `અમે નીચે મુજબની બાબતો ધ્યાને લીધી છે જેમાં આપના માર્ગદર્શનની જરૂર છે:`,
      `• ${params.issuesSummary}`,
      ``,
      `કૃપા કરીને નિયમિત હાજરી અને સમયસર લેસન પૂર્ણ કરાવવા વિનંતી છે. કોઈ સહાયની જરૂર હોય તો અમારો સંપર્ક કરી શકો છો.`,
      ``,
      `_સાદર પ્રણામ,_`,
      `*EduFlow Coaching Academy*`,
    ].join('\n');
  }

  if (lang === 'hi') {
    return [
      `⚠️ *ट्यूशन क्लास से महत्वपूर्ण अपडेट*`,
      `प्रिय अभिभावक, यह संदेश *${params.studentName}* (${params.batchName}) के संबंध में है।`,
      ``,
      `हमने निम्नलिखित बिंदुओं पर ध्यान दिया है जिनमें आपके मार्गदर्शन की आवश्यकता है:`,
      `• ${params.issuesSummary}`,
      ``,
      `कृपया नियमित उपस्थिति और समय पर गृहकार्य पूरा करना सुनिश्चित करें। यदि किसी सहायता की आवश्यकता हो तो हमसे संपर्क करें।`,
      ``,
      `_ सादर,_`,
      `*EduFlow Coaching Academy*`,
    ].join('\n');
  }

  return [
    `⚠️ *Important Update from Tuition Class*`,
    `Dear Parent, this is an update regarding *${params.studentName}* (${params.batchName}).`,
    ``,
    `We observed the following points that require your guidance:`,
    `• ${params.issuesSummary}`,
    ``,
    `Kindly ensure regular attendance and timely homework completion. Please feel free to reach out to us if any support is needed.`,
    ``,
    `_Warm regards,_`,
    `*EduFlow Coaching Academy*`,
  ].join('\n');
}

export function formatTopperWhatsAppMessage(params: {
  studentName: string;
  batchName: string;
  testTitle: string;
  rank: number;
  marksObtained: number;
  maxMarks: number;
  language?: 'en' | 'hi' | 'gu';
}): string {
  const rankEmoji = params.rank === 1 ? '🥇' : params.rank === 2 ? '🥈' : '🥉';
  const percent = Math.round((params.marksObtained / params.maxMarks) * 100);
  const lang = params.language || 'en';

  if (lang === 'gu') {
    return [
      `🌟 *ટ્યુશન ક્લાસ તરફથી ખૂબ ખૂબ અભિનંદન!* 🌟`,
      `આદરણીય વાલીશ્રી, જણાવતા ખૂબ આનંદ થાય છે કે *${params.studentName}* એ તાજેતરની ટેસ્ટમાં ${rankEmoji} *રેન્ક #${params.rank}* મેળવ્યો છે!`,
      ``,
      `📝 *ટેસ્ટ:* ${params.testTitle}`,
      `🏷️ *બેચ:* ${params.batchName}`,
      `🎯 *મેળવેલ ગુણ:* ${params.marksObtained}/${params.maxMarks} (${percent}%)`,
      ``,
      `આવી જ મહેનત અને લગન ચાલુ રાખો! 🚀`,
      ``,
      `_સાદર પ્રણામ,_`,
      `*EduFlow Coaching Academy*`,
    ].join('\n');
  }

  if (lang === 'hi') {
    return [
      `🌟 *ट्यूशन क्लास की ओर से हार्दिक बधाई!* 🌟`,
      `प्रिय अभिभावक, हमें यह बताते हुए खुशी हो रही है कि *${params.studentName}* ने हालिया टेस्ट में ${rankEmoji} *रैंक #${params.rank}* प्राप्त की है!`,
      ``,
      `📝 *टेस्ट:* ${params.testTitle}`,
      `🏷️ *बैच:* ${params.batchName}`,
      `🎯 *प्राप्त अंक:* ${params.marksObtained}/${params.maxMarks} (${percent}%)`,
      ``,
      `शानदार समर्पण और कड़ी मेहनत जारी रखें! 🚀`,
      ``,
      `_सादर,_`,
      `*EduFlow Coaching Academy*`,
    ].join('\n');
  }

  return [
    `🌟 *Congratulations from Tuition Class!* 🌟`,
    `Dear Parent, we are delighted to share that *${params.studentName}* has achieved ${rankEmoji} *Rank #${params.rank}* in the recent test!`,
    ``,
    `📝 *Test:* ${params.testTitle}`,
    `🏷️ *Batch:* ${params.batchName}`,
    `🎯 *Score:* ${params.marksObtained}/${params.maxMarks} (${percent}%)`,
    ``,
    `Keep up the fantastic dedication and hard work! 🚀`,
    ``,
    `_Warm regards,_`,
    `*EduFlow Coaching Academy*`,
  ].join('\n');
}
