import { pipeline } from '@xenova/transformers';

// Initialize the embedding model (happens once, cached)
let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('Loading embedding model (first time only, ~50MB download)...');
    // Using all-MiniLM-L6-v2: Fast, good quality, 384 dimensions
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model loaded!');
  }
  return embedder;
}

/**
 * Generate embedding vector for text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 384-dimensional vector
 */
export async function generateEmbedding(text) {
  try {
    const model = await getEmbedder();
    
    // Truncate text to avoid overload (model has 512 token limit)
    const truncatedText = text.substring(0, 5000);
    
    // Generate embedding
    const output = await model(truncatedText, { pooling: 'mean', normalize: true });
    
    // Convert to array of numbers
    const embedding = Array.from(output.data);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} - Similarity score (0-1)
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
