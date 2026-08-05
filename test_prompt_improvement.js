const http = require('http');

// Test 2 questions to verify architect voice improvement
const testQuestions = [
  "What's the difference between ABAP modifications and extensions?",
  "What's your philosophy on segregation of duties in SAP?"
];

async function testQuestion(question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      question: question,
      context: ""
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const latency = endTime - startTime;
        resolve({
          question,
          response: data,
          latency,
          statusCode: res.statusCode
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== PROMPT ENHANCEMENT TEST ===\n');
  console.log('Testing enhanced architect voice prompt...\n');
  
  for (let i = 0; i < testQuestions.length; i++) {
    console.log(`[${i+1}/2] Testing: "${testQuestions[i]}"\n`);
    try {
      const result = await testQuestion(testQuestions[i]);
      
      // Extract text from streaming response
      const textMatches = result.response.match(/data: \{"text":"([^"]*?)"\}/g);
      const fullText = textMatches?.map(m => m.match(/"text":"([^"]*)"/)[1]).join('') || '';
      
      console.log('Response (first 500 chars):');
      console.log(fullText.substring(0, 500));
      console.log(`...\n`);
      console.log(`Latency: ${result.latency}ms`);
      console.log(`Status: ${result.statusCode}\n`);
      console.log('---\n');
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

runTests().catch(console.error);
