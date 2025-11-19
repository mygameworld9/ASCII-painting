# ASCII Motion Art

<div align="right">
  <a href="#chinese-readme">
    <button>🇨🇳 中文 (Chinese)</button>
  </a>
</div>

<a id="english-readme"></a>

A powerful, interactive web application that transforms images into dynamic, animated ASCII art. It leverages the **Google Gemini API** (Imagen 3) to generate source images from text prompts and provides a highly customizable real-time rendering engine to convert them into character-based visuals.

## ✨ Features

- **AI Image Generation**: Use prompts to create unique images via Google's Imagen model.
- **Real-time Conversion**: Instant transformation of local uploads or AI-generated images into ASCII.
- **Dynamic Animations**:
  - **Matrix**: Digital rain effects with flickering characters.
  - **Wave**: Sine-wave distortion animations.
  - **Jelly**: Wobbling elasticity effects.
  - **Scanline/Glitch**: Retro CRT monitor vibes.
- **Full Customization**: Control resolution, font size, contrast, density/character sets, and colors.
- **Export**: Copy the generated ASCII text directly to your clipboard.

## 🚀 Getting Started

### Prerequisites

To use the AI generation features, you need a **Google Gemini API Key**.

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file and add your API key:
    ```
    API_KEY=your_google_genai_api_key
    ```
4.  Run the application:
    ```bash
    npm start
    ```

## 🛠 Usage

1.  **Upload or Generate**: Drag and drop an image file, or type a prompt (e.g., "A cyberpunk skull") and hit "Generate".
2.  **Configure**: Use the sidebar to adjust the resolution and contrast to get the best look.
3.  **Animate**: Select a mode like "Matrix" or "Wave" to bring the art to life.
4.  **Copy**: Hover over the canvas and click "Copy Text" to save the ASCII representation to your clipboard.

---

<br />
<br />
<br />

<a id="chinese-readme"></a>

# ASCII 动态字符画 (ASCII Motion Art)

<div align="right">
  <a href="#english-readme">
    <button>🇺🇸 English</button>
  </a>
</div>

这是一个强大的交互式 Web 应用程序，可将图像转换为动态的 ASCII 字符画。它利用 **Google Gemini API** (Imagen 3) 根据文本提示生成源图像，并提供高度可定制的实时渲染引擎，将其转换为基于字符的视觉效果。

## ✨ 功能特性

- **AI 图像生成**：使用 Google Imagen 模型通过文本提示词生成独特的图像。
- **实时转换**：即时将本地上传的图片或 AI 生成的图片转换为 ASCII 画。
- **动态动画**：
  - **黑客帝国 (Matrix)**：具有闪烁字符的数字雨效果。
  - **波浪 (Wave)**：正弦波扭曲动画。
  - **果冻 (Jelly)**：摆动弹性效果。
  - **扫描线/故障 (Scanline)**：复古 CRT 显示器风格。
- **全面定制**：控制分辨率、字体大小、对比度、字符集密度和颜色。
- **导出**：将生成的 ASCII 文本直接复制到剪贴板。

## 🚀 快速开始

### 前置要求

要使用 AI 生成功能，您需要一个 **Google Gemini API Key**。

### 安装

1.  克隆仓库。
2.  安装依赖：
    ```bash
    npm install
    ```
3.  创建 `.env` 文件并添加您的 API 密钥：
    ```
    API_KEY=your_google_genai_api_key
    ```
4.  运行应用程序：
    ```bash
    npm start
    ```

## 🛠 使用指南

1.  **上传或生成**：拖放图像文件，或输入提示词（例如，“赛博朋克骷髅”）并点击“生成”。
2.  **配置**：使用侧边栏调整分辨率和对比度以获得最佳效果。
3.  **动画**：选择“Matrix”或“Wave”等模式，让字符画动起来。
4.  **复制**：将鼠标悬停在画布上，点击“复制文本”即可将 ASCII 字符画保存到剪贴板。
