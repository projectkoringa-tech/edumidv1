export interface FileData {
  mimeType: string;
  data: string; // base64
}

async function callAiChat(messages: any[], systemInstruction: string) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemInstruction })
  });
  if (!response.ok) throw new Error('AI request failed');
  const data = await response.json();
  return data.text;
}

async function callAiJson(prompt: string, systemInstruction: string) {
  const response = await fetch('/api/ai/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction })
  });
  if (!response.ok) throw new Error('AI JSON request failed');
  return await response.json();
}

export async function askTutor(prompt: string, history: { role: 'user' | 'model' | 'assistant', content: string }[], file?: FileData) {
  const messages = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : h.role,
    content: h.content
  }));

  let content = prompt;
  if (file) {
    content += `\n\n[Nota: O usuário anexou um arquivo do tipo ${file.mimeType}. Por favor, analise as informações contidas nele se possível.]`;
    // OpenAI vision would be better here, but for now we'll just pass a note since we aren't doing OCR on server yet.
    // Or we could use GPT-4o vision if we formatted correctly.
  }

  messages.push({ role: 'user', content });

  return await callAiChat(messages, "Você é um tutor de estudos inteligente e amigável chamado EduMind. Seu objetivo é ajudar estudantes a entender conceitos complexos, responder perguntas acadêmicas e incentivar o pensamento crítico. Use uma linguagem clara, didática e em português brasileiro.");
}

export async function generateFlashcards(topic: string) {
  const system = "Você é um especialista em educação. Retorne apenas JSON.";
  const prompt = `Gere 5 a 10 flashcards sobre o tópico: "${topic}". Retorne no formato: {"flashcards": [{"front": "pergunta", "back": "resposta"}]}`;
  const result = await callAiJson(prompt, system);
  return result.flashcards || [];
}

export async function summarizeText(text: string, file?: FileData) {
  let content = text;
  if (file) {
    content += `\n\n[Anexo: Arquivo ${file.mimeType}]`;
  }
  
  const messages = [
    { role: 'user', content: `Resuma o seguinte conteúdo de forma estruturada: \n\n${content}` }
  ];

  return await callAiChat(messages, "Você é um especialista em síntese de conteúdo. Crie resumos claros e objetivos em português brasileiro.");
}

export async function generateLesson(subject: string, topic: string, level: string) {
  const messages = [
    { role: 'user', content: `Gere uma aula completa sobre "${topic}" para a disciplina de "${subject}", adequada para o nível "${level}".` }
  ];
  return await callAiChat(messages, "Você é um professor experiente. Crie aulas envolventes e didáticas.");
}

export async function generateExercises(subject: string, topic: string, level: string) {
  const messages = [
    { role: 'user', content: `Gere 5 exercícios de fixação sobre "${topic}" para "${subject}" no nível "${level}".` }
  ];
  return await callAiChat(messages, "Você é um avaliador acadêmico. Crie exercícios desafiadores.");
}

export async function assignHomework(subject: string, topic: string, level: string = "superior") {
  const messages = [
    { role: 'user', content: `Atribua uma tarefa de casa sobre "${topic}" para "${subject}" no nível "${level}".` }
  ];
  return await callAiChat(messages, "Você é um tutor pedagógico. Crie tarefas práticas.");
}

export async function generateMirKoringaLesson(subject: string, topic: string, level: string = "superior") {
  const messages = [
    { role: 'user', content: `Dê uma aula sobre "${topic}" da disciplina "${subject}" para o nível "${level}". Assine como "Prof. Eng. Mir Koringa".` }
  ];
  return await callAiChat(messages, "Você é o Prof. Eng. Mir Koringa, um professor de engenharia e tutor dedicado. Sua linguagem é técnica porém acessível e profissional.");
}

export async function correctTask(taskContent: string, studentResponse: string) {
  const messages = [
    { role: 'user', content: `Corrija a tarefa: \n\nENUNCIADO: ${taskContent}\n\nRESPOSTA: ${studentResponse}` }
  ];
  return await callAiChat(messages, "Você é o Prof. Eng. Mir Koringa. Forneça uma correção detalhada e encorajadora.");
}

export async function recommendVideos(subject: string, topic: string) {
  const system = "Você é um assistente de pesquisa educacional. Retorne apenas JSON.";
  const prompt = `Recomende 3 vídeos do YouTube sobre "${topic}" em "${subject}". Retorne no formato: {"videos": [{"title": "título", "url": "URL", "thumbnail": "URL"}]}`;
  const result = await callAiJson(prompt, system);
  return result.videos || [];
}

export async function generateStudySchedule(subjects: string[], schoolHours: string) {
  const system = "Você é um organizador de estudos. Retorne apenas JSON.";
  const prompt = `Gere um cronograma semanal para as disciplinas: ${subjects.join(', ')}. O aluno está ocupado das ${schoolHours}. Retorne no formato: {"schedule": {"Segunda": [{"time": "08:00", "activity": "Estudar", "subject": "Matemática"}], ... } }`;
  const result = await callAiJson(prompt, system);
  return result.schedule || {};
}

export async function chatInLesson(subject: string, topic: string, lessonContent: string, userMessage: string, history: { role: 'user' | 'model' | 'assistant', content: string }[]) {
  const messages = [
    { role: 'system', content: `Estamos na aula de ${subject} sobre ${topic}. Conteúdo: ${lessonContent}` },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.content })),
    { role: 'user', content: userMessage }
  ];
  return await callAiChat(messages, "Você é o Prof. Eng. Mir Koringa. Responda de forma didática.");
}
