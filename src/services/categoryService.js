import { supabase } from '@/lib/supabase'

// Default categories in Hebrew
const DEFAULT_CATEGORIES = {
  'ירקות ופירות': [
    'עגבניה', 'מלפפון', 'גזר', 'בצל', 'תפוח אדמה', 'תפוח', 'בננה', 'תפוז',
    'לימון', 'פלפל', 'חסה', 'כרוב', 'אבוקדו', 'מנגו', 'ענבים', 'אגס'
  ],
  'מוצרי חלב': [
    'חלב', 'גבינה', 'יוגורט', 'קוטג', 'שמנת', 'חמאה', 'מעדן', 'גבינה צהובה',
    'גבינה לבנה', 'שוקו'
  ],
  'בשר ודגים': [
    'עוף', 'בשר', 'הודו', 'דג', 'סלמון', 'טונה', 'שניצל', 'המבורגר',
    'נקניק', 'נקניקיות'
  ],
  'מאפים': [
    'לחם', 'פיתות', 'לחמניות', 'חלה', 'עוגה', 'עוגיות', 'קרואסון', 'בייגלה',
    'קרקרים'
  ],
  'שימורים': [
    'טונה', 'תירס', 'זיתים', 'מלפפונים חמוצים', 'קטשופ', 'רסק עגבניות',
    'תבלינים', 'שימורי ירקות'
  ],
  'משקאות': [
    'מים', 'קולה', 'ספרייט', 'מיץ', 'בירה', 'יין', 'סודה', 'משקה אנרגיה',
    'תה', 'קפה'
  ],
  'ממתקים וחטיפים': [
    'שוקולד', 'חטיף', 'במבה', 'ביסלי', 'צ׳יפס', 'מסטיק', 'סוכריות', 'עוגיות',
    'קרמבו'
  ],
  'מוצרי ניקיון': [
    'סבון', 'שמפו', 'מרכך', 'נייר טואלט', 'מגבונים', 'אקונומיקה', 'סבון כלים',
    'מנקה חלונות', 'אבקת כביסה'
  ]
}

// Split compound categories into their components
const CATEGORY_MAPPINGS = {
  'ירקות ופירות': ['ירקות', 'פירות'],
  'בשר ודגים': ['בשר', 'דגים'],
  'ממתקים וחטיפים': ['ממתקים', 'חטיפים']
}

// Reverse mappings for individual categories to their compound category
const REVERSE_CATEGORY_MAPPINGS = Object.entries(CATEGORY_MAPPINGS).reduce((acc, [compound, parts]) => {
  parts.forEach(part => {
    acc[part] = compound
  })
  return acc
}, {})

export class CategoryService {
  // Flag to indicate experimental feature
  static isExperimentalAIEnabled = false

  static async suggestCategory(productName, existingProducts, useAI = false) {
    // Only try AI if it's enabled and specifically requested
    if (this.isExperimentalAIEnabled && useAI) {
      try {
        // Try Hugging Face API first
        const suggestion = await this.huggingFaceSuggest(productName, existingProducts)
        if (suggestion) {
          return this.normalizeCategory(suggestion)
        }
      } catch (error) {
        console.error('Error with Hugging Face API:', error)
      }
    }

    // If AI is disabled or failed, use local matching
    return this.basicSuggestCategory(productName, existingProducts)
  }

  // Toggle for experimental AI feature
  static setExperimentalAIEnabled(enabled) {
    this.isExperimentalAIEnabled = enabled
  }

  static async huggingFaceSuggest(productName, existingProducts) {
    try {
      // Get all possible categories (from both existing products and defaults)
      const existingCategories = [...new Set(existingProducts
        .map(p => p.category)
        .filter(c => c && c !== 'ללא'))]
      
      const defaultCategories = Object.keys(DEFAULT_CATEGORIES)
      const allCategories = [...new Set([...existingCategories, ...defaultCategories])]

      // If we don't have enough categories, fall back to basic suggestion
      if (allCategories.length < 2) {
        return null
      }

      // Create examples from existing products for few-shot learning
      const examples = existingProducts
        .filter(p => p.category && p.category !== 'ללא')
        .map(p => ({
          text: p.name,
          label: p.category
        }))
        .slice(0, 10) // Use up to 10 most recent examples

      // Add examples from DEFAULT_CATEGORIES
      Object.entries(DEFAULT_CATEGORIES).forEach(([category, items]) => {
        items.slice(0, 3).forEach(item => { // Take 3 examples from each default category
          examples.push({
            text: item,
            label: category
          })
        })
      })

      // Use Hugging Face's zero-shot classification with examples
      const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: productName,
            parameters: {
              candidate_labels: allCategories,
              multi_label: false,
              hypothesis_template: "This product is in the category of {}.",
              premise_template: "Product name: {}",
            },
            examples: examples.map(ex => ({
              text: `Product name: ${ex.text}`,
              label: ex.label
            }))
          }),
        }
      )

      const result = await response.json()
      
      if (!result.labels || !result.scores || result.labels.length === 0) {
        return null
      }

      // Get the highest scoring category
      const bestMatch = result.labels[0]
      const confidence = result.scores[0]

      // Only use the suggestion if confidence is high enough
      return confidence > 0.6 ? bestMatch : null

    } catch (error) {
      console.error('Error with Hugging Face classification:', error)
      return null
    }
  }

  static normalizeCategory(category) {
    // If the category is a known individual category, return its compound form
    if (REVERSE_CATEGORY_MAPPINGS[category]) {
      return REVERSE_CATEGORY_MAPPINGS[category]
    }
    return category
  }

  static basicSuggestCategory(productName, existingProducts) {
    // Convert product name to lowercase for comparison
    const name = productName.toLowerCase()
    
    // First try to match with existing products
    const existingMatches = this.findMatchesInExisting(name, existingProducts)
    if (existingMatches.length > 0) {
      // Get category frequencies from all existing products
      const categoryFrequencies = existingProducts.reduce((acc, product) => {
        if (product.category && product.category !== 'ללא') {
          const normalizedCategory = this.normalizeCategory(product.category)
          acc[normalizedCategory] = (acc[normalizedCategory] || 0) + 1
        }
        return acc
      }, {})
      
      // Calculate scores for each matched category
      const categoryScores = existingMatches.reduce((acc, match) => {
        if (!match.category || match.category === 'ללא') return acc
        
        const normalizedCategory = this.normalizeCategory(match.category)
        
        // Base score from match
        let score = match.similarity
        
        // Boost score based on category frequency, but with a smaller boost
        const frequencyBoost = Math.log(categoryFrequencies[normalizedCategory] || 1) / 20
        score *= (1 + frequencyBoost)
        
        acc[normalizedCategory] = (acc[normalizedCategory] || 0) + score
        return acc
      }, {})
      
      // Sort categories by score
      const [topCategory] = Object.entries(categoryScores)
        .sort(([,a], [,b]) => b - a)
      
      if (topCategory && topCategory[1] > 0.7) return topCategory[0]
    }
    
    // Try default categories with stricter matching
    const defaultMatch = this.findMatchInDefaults(name)
    if (defaultMatch) return defaultMatch

    // If we have existing products, suggest the most common category only if very frequent
    if (existingProducts.length > 0) {
      const categoryFrequencies = existingProducts.reduce((acc, product) => {
        if (product.category && product.category !== 'ללא') {
          const normalizedCategory = this.normalizeCategory(product.category)
          acc[normalizedCategory] = (acc[normalizedCategory] || 0) + 1
        }
        return acc
      }, {})
      
      const [mostCommonCategory] = Object.entries(categoryFrequencies)
        .sort(([,a], [,b]) => b - a)
      
      if (mostCommonCategory && mostCommonCategory[1] > 5) {
        return mostCommonCategory[0]
      }
    }

    return 'ללא'
  }

  static findMatchesInExisting(name, existingProducts) {
    const matches = []
    const nameWords = name.split(' ')
    
    for (const product of existingProducts) {
      if (!product.name) continue
      
      const productName = product.name.toLowerCase()
      const productWords = productName.split(' ')
      
      // Calculate word similarity score
      const similarity = this.calculateWordSimilarity(nameWords, productWords)
      
      // Increase similarity threshold to 0.5 for stricter matching
      if (similarity > 0.5) {
        matches.push({
          ...product,
          similarity
        })
      }
    }
    
    // Sort matches by similarity score
    return matches.sort((a, b) => b.similarity - a.similarity)
  }

  static calculateWordSimilarity(words1, words2) {
    let maxSimilarity = 0
    
    for (const word1 of words1) {
      if (word1.length < 2) continue
      
      for (const word2 of words2) {
        if (word2.length < 2) continue
        
        // Calculate Levenshtein distance
        const distance = this.levenshteinDistance(word1, word2)
        const maxLength = Math.max(word1.length, word2.length)
        const similarity = 1 - (distance / maxLength)
        
        // Check for substring matches
        if (word1.includes(word2) || word2.includes(word1)) {
          const substringSimilarity = Math.min(word1.length, word2.length) / Math.max(word1.length, word2.length)
          maxSimilarity = Math.max(maxSimilarity, substringSimilarity)
        }
        
        maxSimilarity = Math.max(maxSimilarity, similarity)
      }
    }
    
    return maxSimilarity
  }

  static levenshteinDistance(str1, str2) {
    const m = str1.length
    const n = str2.length
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0))
    
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i-1] === str2[j-1]) {
          dp[i][j] = dp[i-1][j-1]
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i-1][j],   // deletion
            dp[i][j-1],   // insertion
            dp[i-1][j-1]  // substitution
          )
        }
      }
    }
    
    return dp[m][n]
  }

  static findMatchInDefaults(name) {
    const nameWords = name.split(' ')
    let bestMatch = null
    let bestScore = 0
    let categoryScores = {}
    
    // First try to match with individual category names
    for (const [compound, parts] of Object.entries(CATEGORY_MAPPINGS)) {
      let bestPartScore = 0
      
      // Check each part of the compound category
      for (const part of parts) {
        const similarity = this.calculateWordSimilarity([part.toLowerCase()], nameWords)
        if (similarity > bestPartScore) {
          bestPartScore = similarity
        }
      }
      
      categoryScores[compound] = bestPartScore
      
      if (bestPartScore > bestScore) {
        bestScore = bestPartScore
        bestMatch = compound
      }
    }
    
    // If no good match found with category names, try matching with examples
    if (bestScore < 0.7) {
      for (const [category, examples] of Object.entries(DEFAULT_CATEGORIES)) {
        let categoryScore = 0
        
        for (const example of examples) {
          const exampleWords = example.toLowerCase().split(' ')
          const similarity = this.calculateWordSimilarity(nameWords, exampleWords)
          categoryScore = Math.max(categoryScore, similarity)
        }
        
        categoryScores[category] = Math.max(categoryScores[category] || 0, categoryScore)
        
        if (categoryScore > bestScore) {
          bestScore = categoryScore
          bestMatch = category
        }
      }
    }
    
    // Check if multiple categories have similar high scores
    const closeScores = Object.entries(categoryScores).filter(([, score]) => 
      score > bestScore - 0.1
    )
    
    // If multiple categories are close in score, don't make a suggestion
    if (closeScores.length > 1) {
      return null
    }
    
    // Require a higher similarity score (0.7) for default categories
    return bestScore > 0.7 ? bestMatch : null
  }
} 