const url = "https://integrate.api.nvidia.com/v1/chat/completions"

const payload = {
  model: "mistralai/mistral-large-3-675b-instruct-2512",
  messages: [{ role: "user", content: "hii" }],
  max_tokens: 2048,
  temperature: 0.15,
  top_p: 1.00,
  frequency_penalty: 0.00,
  presence_penalty: 0.00,
  stream: false
}

fetch(url, {
  method: "POST",
  headers: {
    "Authorization": "Bearer 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",
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => {
  console.log("NVIDIA API Response:")
  console.log(JSON.stringify(data, null, 2))
})
.catch(err => {
  console.error("NVIDIA API Error:", err)
})
