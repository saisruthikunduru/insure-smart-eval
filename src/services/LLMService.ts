interface ParsedQuery {
  age?: number;
  gender?: string;
  procedure?: string;
  location?: string;
  policyDuration?: string;
}

interface PolicyClause {
  title: string;
  pageNumber?: number;
  snippet: string;
  reasoning: string;
}

interface EvaluationResult {
  parsedQuery: ParsedQuery;
  decision: 'Approved' | 'Rejected' | 'More Info Needed';
  amount?: number;
  justification: PolicyClause[];
}

export class LLMService {
  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      
      // For PDF and DOC files, we'll treat them as text for now
      // In a real implementation, you'd use libraries like PDF.js or mammoth.js
      if (file.type === 'application/pdf') {
        // For demo purposes, we'll simulate PDF text extraction
        resolve(`[PDF Content from ${file.name}]\n\nThis is simulated PDF text content. In a real implementation, this would be extracted using PDF.js or a similar library.`);
      } else {
        reader.readAsText(file);
      }
    });
  }

  static async evaluateClaim(
    query: string,
    files: File[],
    apiKey: string
  ): Promise<EvaluationResult> {
    try {
      // Read all uploaded files
      const documentContents = await Promise.all(
        files.map(async (file) => {
          const content = await this.readFileAsText(file);
          return {
            filename: file.name,
            content: content
          };
        })
      );

      const documentsText = documentContents
        .map(doc => `=== ${doc.filename} ===\n${doc.content}`)
        .join('\n\n');

      // Prepare the prompt for the LLM
      const prompt = `You are an expert insurance claim evaluator. Analyze the following medical case and policy documents to determine if the claim should be approved.

MEDICAL CASE:
${query}

POLICY DOCUMENTS:
${documentsText}

Please provide a JSON response with the following structure:
{
  "parsedQuery": {
    "age": number or null,
    "gender": "string or null",
    "procedure": "string or null", 
    "location": "string or null",
    "policyDuration": "string or null"
  },
  "decision": "Approved" | "Rejected" | "More Info Needed",
  "amount": number or null,
  "justification": [
    {
      "title": "Relevant policy clause title",
      "pageNumber": number or null,
      "snippet": "Relevant text from policy",
      "reasoning": "Explanation of how this clause applies"
    }
  ]
}

Guidelines:
1. Parse the query to extract structured information
2. Look for relevant clauses in the policy documents (exclusions, waiting periods, coverage limits, etc.)
3. Make a decision based on policy terms
4. Provide clear reasoning for each relevant clause
5. If amount is covered, estimate based on policy terms
6. Be thorough but concise in your analysis

Respond only with valid JSON.`;

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert insurance claim evaluator. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse the JSON response
      try {
        const result = JSON.parse(content) as EvaluationResult;
        
        // Validate the response structure
        if (!result.parsedQuery || !result.decision || !result.justification) {
          throw new Error('Invalid response structure from AI');
        }

        return result;
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Invalid JSON response from AI. Please try again.');
      }

    } catch (error) {
      console.error('LLM Service error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during claim evaluation');
    }
  }
}