export const codeLanguages = ['pseint', 'arduino', 'python', 'html', 'css', 'javascript', 'excel', 'text'] as const;
export const codeLanguageLabels: Record<typeof codeLanguages[number], string> = {
  pseint: 'PSeInt', arduino: 'Arduino/C++', python: 'Python', html: 'HTML', css: 'CSS',
  javascript: 'JavaScript', excel: 'Fórmulas de Excel', text: 'Texto general',
};
