export const quotes = [
  { text: "The limits of my language are the limits of my world.", author: "Ludwig Wittgenstein" },
  { text: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith" },
  { text: "Language is the road map of a culture.", author: "Rita Mae Brown" },
  { text: "To have another language is to possess a second soul.", author: "Charlemagne" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "A different language is a different vision of life.", author: "Federico Fellini" },
  { text: "You can never understand one language until you understand at least two.", author: "Geoffrey Willans" },
  { text: "Language is not a genetic gift, it is a social gift.", author: "Frank Smith" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Mistakes are proof that you are trying.", author: "Jennifer Lim" },
  { text: "Confidence is not about being perfect. It is about being willing to try.", author: "Anonymous" },
  { text: "Small progress is still progress.", author: "Anonymous" },
  { text: "Fluency is built one conversation at a time.", author: "SpeakUp" },
  { text: "Your accent is not your enemy. Your silence is.", author: "SpeakUp" },
];

export function getDailyQuote() {
  const day = new Date().getDate();
  return quotes[day % quotes.length];
}
