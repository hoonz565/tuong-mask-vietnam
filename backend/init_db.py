import sqlite3
import os

def init_db():
    db_path = 'masks.db'
    
    # Kết nối (hoặc tạo mới) database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Tạo bảng masks
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS masks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        image_url TEXT
    )
    ''')

    # Dữ liệu mẫu (một số mặt nạ nổi tiếng)
    sample_masks = [
        ("ac_ba", "Ác Ba", "Tuồng Cổ", "http://localhost:8000/static/images/1.png"),
        ("ac_tang", "Ác Tăng", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/2.png"),
        ("bach_vien", "Bạch Viên", "Tuồng Thanh Xà-Bạch Xà", "http://localhost:8000/static/images/3.png"),
        ("bac_vuong", "Bác Vương", "", "http://localhost:8000/static/images/4.png"),
        ("bao_cong1", "Bao Công", "Tuồng Nam Bộ", "http://localhost:8000/static/images/5.png"),
        ("bao_cong2", "Bao Công", "Tuồng Bao Công Xử Án", "http://localhost:8000/static/images/6.png"),
        ("bat_vuong", "Bát Vương", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/7.png"),
        ("bat_dong", "Bạt Dõng", "Tuồng Xuân Đào Lóc Thịt", "http://localhost:8000/static/images/8.png"),
        ("binh_vuong", "Bình Vương", "Tuồng Võ Hùng Vương", "http://localhost:8000/static/images/9.png"),
        ("cap_to_van", "Cáp Tô Vằn", "Tuồng Đàn Thế Dân Sa Lầy", "http://localhost:8000/static/images/10.png"),
        ("cat_thuong_hung", "Cát Thượng Hùng", "Tuồng Đào Phi Phụng", "http://localhost:8000/static/images/11.png"),
        ("chau_thuong", "Châu Thương", "Tuồng Tam Quốc", "http://localhost:8000/static/images/12.png"),
        ("chau_xuong", "Châu Xương", "", "http://localhost:8000/static/images/13.png"),
        ("chau_du", "Châu Du", "Tuồng Tam Quốc", "http://localhost:8000/static/images/14.png")
    ]

    # Clear old data to avoid duplicates on re-run
    cursor.execute('DELETE FROM masks')

    # Insert all masks
    cursor.executemany('INSERT INTO masks (id, name, category, image_url) VALUES (?, ?, ?, ?)', sample_masks)

    conn.commit()
    conn.close()
    print(f"Database masks.db initialized with {len(sample_masks)} records.")

if __name__ == "__main__":
    init_db()
