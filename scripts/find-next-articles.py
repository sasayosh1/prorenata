import pandas as pd

def find_next_articles(file_path):
    try:
        df = pd.read_csv(file_path)
        top_pages = df.groupby('page')['impressions'].sum().sort_values(ascending=False).head(30)
        
        processed_slugs = [
            'nursing-assistant-resume-writing',
            'nursing-assistant-interview-prep',
            'nursing-assistant-patient-transfer-safety',
            'nursing-assistant-stressful-relationships-solutions',
            'nursing-assistant-become-nurse-guide',
            'nursing-assistant-essentials-checklist',
            'nursing-assistant-aptitude-test',
            'nursing-assistant-daily-schedule',
            'nursing-assistant-interview-tips',
            'nursing-assistant-care-guide',
            'nursing-assistant-qualification-study',
            'nursing-assistant-care-guide-focus',
            'nursing-assistant-medical-terms',
            'nursing-assistant-job-change-manual',
            'nursing-assistant-night-shift-practical',
            'nursing-assistant-qualification-guide',
            'nursing-assistant-communication-guide', # Failed but let's exclude to avoid retry loop
            'nursing-assistant-communication-tips',
            'nursing-assistant-to-nurse-route',
            'nursing-assistant-night-shift-survival',
            'nursing-assistant-certification-merit',
            'nursing-assistant-career-change-timing'
        ]

        print("Next Articles to Process:")
        count = 0
        for page, impressions in top_pages.items():
            slug = page.split('/')[-1]
            if slug not in processed_slugs and slug != '':
                print(f"- {slug} ({impressions} imp)")
                count += 1
                if count >= 10:
                    break
            
    except Exception as e:
        print(f"Error analyzing data: {e}")

if __name__ == "__main__":
    find_next_articles('data/gsc_last30d.csv')
