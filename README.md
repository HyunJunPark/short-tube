# YouTube Keyword Monitoring & AI Summary Assistant

## Step 1: UI/UX & Data Management (Streamlit)

This is the initial MVP for managing your YouTube channel subscriptions and monitoring keywords.

### How to Run

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Streamlit app:**
   ```bash
   streamlit run app.py
   ```

### Features Implemented
- **Dashboard:** Card-based view for registered channels.
- **Tag Management:** Add/remove keyword tags for each channel.
- **Settings:** Configure notification time and target platform.
- **Persistence:** All data is automatically saved to `data.json`.
