

# ASCII Motion Art

<div align="right">
  <a href="#chinese-readme">
    <button>🇨🇳 中文 (Chinese)</button>
  </a>
</div>

<a id="english-readme"></a>

A powerful, interactive web application that transforms images into dynamic, animated ASCII art, Bead art, Pixel art, or Minecraft blocks. It leverages the **Google Gemini API** (Imagen 3) to generate source images from text prompts and provides a highly customizable real-time rendering engine.

## ✨ Features

- **AI Image Generation**: Use prompts to create unique images via Google's Imagen model.
- **Real-time Conversion**: Instant transformation of local uploads or AI-generated images.
- **Four Render Modes**:
  - **ASCII**: Classic text-based character art.
  - **Bead Art**: Colorful, pixel-perfect circle/bead grids (拼豆 style).
  - **Pixel Art**: Clear, grid-based pixel rendering.
  - **Minecraft**: Voxel-style block rendering with 3D beveled edges.
- **Dynamic Animations**:
  - **Wave**: Sine-wave distortion animations.
  - **Jelly**: Wobbling elasticity effects.
  - **Scanline/Glitch**: Retro CRT monitor vibes.
- **Full Customization**: Control resolution, font/cell size, contrast, density/character sets, and colors.
- **Export**: Copy the generated ASCII text directly to your clipboard (ASCII mode only).

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

1.  **Upload or Generate**: Drag and drop an image file, or type a prompt.
2.  **Choose Style**: Switch between **ASCII**, **Bead**, **Pixel**, and **Minecraft** modes in the sidebar.
3.  **Configure**: Adjust the resolution to control the level of detail.
4.  **Animate**: Select a mode like "Wave" or "Jelly" to distort the image in real-time.

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

这是一个强大的交互式 Web 应用程序，可将图像转换为动态的 ASCII 字符画、拼豆画、像素画或 Minecraft 风格的方块画。它利用 **Google Gemini API** (Imagen 3) 根据文本提示生成源图像，并提供高度可定制的实时渲染引擎。

## ✨ 功能特性

- **AI 图像生成**：使用 Google Imagen 模型通过文本提示词生成独特的图像。
- **实时转换**：即时将本地上传的图片或 AI 生成的图片转换为艺术画。
- **四种渲染模式**：
  - **ASCII**：经典的文本字符画。
  - **拼豆艺术 (Bead Art)**：多彩的像素风格圆形网格。
  - **像素画 (Pixel Art)**：清晰的网格化像素渲染。
  - **Minecraft**：具有 3D 倒角边缘的体素方块风格渲染。
- **动态动画**：
  - **波浪 (Wave)**：正弦波扭曲动画。
  - **果冻 (Jelly)**：摆动弹性效果。
  - **扫描线/故障 (Scanline)**：复古 CRT 显示器风格。
- **全面定制**：控制分辨率、单元格大小、对比度、字符集密度和颜色。
- **导出**：将生成的 ASCII 文本直接复制到剪贴板（仅限 ASCII 模式）。

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

1.  **上传或生成**：上传图片或输入提示词生成。
2.  **选择风格**：在侧边栏中切换 **ASCII**、**Bead (拼豆)**、**Pixel (像素)** 或 **Minecraft** 模式。
3.  **配置**：调整分辨率以控制细节水平。
4.  **动画**：选择“Wave”或“Jelly”等模式，实时扭曲和动画化图像。