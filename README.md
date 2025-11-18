# InkSight 🖋️

**AI-Powered Tattoo Generation & Design Studio**

InkSight is a sophisticated web application that helps users visualize unique tattoo concepts. By leveraging Google's advanced **Gemini 3.0** and **Imagen 4.0** models, InkSight transforms abstract emotions and stories into artist-ready tattoo stencils and visual references.

## ✨ Features

### 🧠 Two Generation Modes
1.  **Direct Idea:** Quickly generate high-quality tattoo visualizations from a simple text prompt and style selection.
2.  **Personalized Journey:** An adaptive AI "InkOracle" conducts a psychometric interview to understand the user's story, memories, and emotions before synthesizing a deeply personal design concept.

### 🎨 Interactive Design Studio
*   **Inline Editor:** Tweak your designs directly within the result card.
*   **Layering System:** Add isolated elements (roses, daggers, geometric shapes) generated on-the-fly by AI.
*   **Composition Tools:** Move, resize, rotate, and adjust opacity of elements to create the perfect composition.
*   **Text Support:** Add custom text to your designs.

### 🛠️ Advanced Tools
*   **Magic Refine:** Use natural language to edit existing generated images (e.g., "Make the lines thicker," "Add a halo").
*   **Style Library:** Support for 12+ distinct tattoo styles including Fine-line, Trash Polka, Biomechanical, and Watercolor.
*   **Artist Handoff:** Generates a specific "Artist Prompt" and placement advice to help users communicate effectively with their tattoo artist.

## 🚀 Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **AI SDK:** Google GenAI SDK (`@google/genai`)
*   **Models Used:**
    *   `gemini-3-pro-preview`: For complex reasoning, interviewing, and concept synthesis.
    *   `imagen-4.0-generate-001`: For high-fidelity generation of isolated tattoo elements.
    *   `gemini-2.5-flash-image`: For fast multimodal tasks and image variation generation.

## 🛠️ Getting Started

### Prerequisites

*   Node.js (v18+)
*   A Google Cloud Project with the **Gemini API** enabled.
*   An API Key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/inksight.git
    cd inksight
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your API key:
    ```env
    API_KEY=your_google_genai_api_key_here
    ```

4.  **Run the Application**
    ```bash
    npm start
    # or
    npm run dev
    ```

5.  Open your browser to `http://localhost:3000` (or the port shown in your terminal).

## 📂 Project Structure

*   **`App.tsx`**: Main application controller handling routing between Direct and Personalized modes.
*   **`services/geminiService.ts`**: Centralized logic for interacting with the Google GenAI SDK. Handles prompt engineering and JSON parsing.
*   **`components/TattooEditor.tsx`**: The interactive canvas logic for positioning, resizing, and layering elements.
*   **`components/ResultCard.tsx`**: Displays the generated concept and integrates the editor.
*   **`types.ts`**: TypeScript definitions for Tattoo Concepts, Variations, and Editor Layers.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Note: InkSight is a conceptual tool. Always consult with a professional tattoo artist for final design feasibility and placement.*
