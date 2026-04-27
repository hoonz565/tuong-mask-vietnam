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
        ("bat_vuong", "Bát Vương", "Tuồng Cổ", "http://localhost:8000/static/images/bat_vuong.png"),
        ("khuong_linh_ta", "Khương Linh Tá", "Tuồng Cổ", "http://localhost:8000/static/images/khuong_linh_ta.png"),
        ("ta_on_dinh", "Tạ Ôn Đình", "Tuồng Cổ", "http://localhost:8000/static/images/ta_on_dinh.png"),
        ("dong_kim_lan", "Đổng Kim Lân", "Tuồng Cổ", "http://localhost:8000/static/images/dong_kim_lan.png"),
        ("luu_xuan_hong", "Lưu Xuân Hồng", "Tuồng Cổ", "http://localhost:8000/static/images/luu_xuan_hong.png"),
        ("dao_tam_xuan", "Đào Tam Xuân", "Tuồng Cổ", "http://localhost:8000/static/images/dao_tam_xuan.png"),
        ("trinh_an", "Trịnh Ân", "Tuồng Cổ", "http://localhost:8000/static/images/trinh_an.png"),
        ("tao_thao", "Tào Tháo", "Tuồng Cổ", "http://localhost:8000/static/images/tao_thao.png"),
        ("quan_cong", "Quan Công", "Tuồng Cổ", "http://localhost:8000/static/images/quan_cong.png"),
        ("truong_phi", "Trương Phi", "Tuồng Cổ", "http://localhost:8000/static/images/truong_phi.png"),
        ("ac_ba", "Ác Ba", "Tuồng Cổ", "http://localhost:8000/static/images/ac_ba.png"),
    ]

    # Xóa dữ liệu cũ nếu có để tránh trùng lặp khi chạy lại
    cursor.execute('DELETE FROM masks')

    # Chèn dữ liệu mẫu
    cursor.executemany('INSERT INTO masks (id, name, category, image_url) VALUES (?, ?, ?, ?)', sample_masks)

    # Tạo thêm các placeholder cho đủ 12 mặt nạ
    placeholders = []
    for i in range(len(sample_masks) + 1, 13):
        mask_id = f"mask_{i}"
        name = f"Mặt nạ số {i}"
        category = "Đang cập nhật"
        image_url = f"http://localhost:8000/static/images/placeholder.png"
        placeholders.append((mask_id, name, category, image_url))
    
    cursor.executemany('INSERT INTO masks (id, name, category, image_url) VALUES (?, ?, ?, ?)', placeholders)

    conn.commit()
    conn.close()
    print(f"Database masks.db initialized with {12} records.")

if __name__ == "__main__":
    init_db()
