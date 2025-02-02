require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

const uploads = multer({ dest: "/uploads" });

if (!process.env.GEMINI_API_KEY) {
  console.error("Error: .env file is missing the API key");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.post("/get", uploads.single("file"), async (req, res) => {
  const userInput = req.body.msg;
  const file = req.file;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let prompt = [userInput];
    if (file) {
      const fileData = fs.readFileSync(file.path); // Read file from the temporary location
      const image = {
        inlineData: {
          data: fileData.toString("base64"), // Convert file data to Base64
          mimeType: file.mimetype, // Specify the MIME type of the file
        },
      };
      prompt.push(image); // Append the image data to the prompt
    }

    // Generate content using the AI model
    const response = await model.generateContent(prompt);

    // Send the generated text response to the client
    res.send(response.response.text());
  } catch (error) {
    console.error("Error generating response: ".error);
    res
      .status(error.status || 500)
      .send("An error occured while generating the response.");
  } finally {
    if (file) {
      fs.unlinkSync(file.path);
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
