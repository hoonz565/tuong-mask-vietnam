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
        ("chau_du", "Châu Du", "Tuồng Tam Quốc", "http://localhost:8000/static/images/14.png"),
        ("cong_tu_bot", "Công Tử Bột", "", "http://localhost:8000/static/images/15.png"),
        ("dong_kim_lan", "Đổng Kim Lân", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/16.png"),
        ("dao_phi_phung", "Đào Phi Phụng", "Tuồng Đào Phi Phụng", "http://localhost:8000/static/images/17.png"),
        ("dao_tam_xuan", "Đào Tam Xuân", "Tuồng Trảm Trịnh Ân", "http://localhost:8000/static/images/18.png"),
        ("chay_to_bat_19", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/19.png"),
        ("chay_to_bat_20", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/20.png"),
        ("chay_to_bat_21", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/21.png"),
        ("chay_to_bat_22", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/22.png"),
        ("chay_to_bat_23", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/23.png"),
        ("chay_to_bat_24", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/24.png"),
        ("chay_to_bat_25", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/25.png"),
        ("chay_to_bat_26", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/26.png"),
        ("chay_to_bat_27", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/27.png"),
        ("chay_to_bat_28", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/28.png"),
        ("chay_to_bat_29", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/29.png"),
        ("chay_to_bat_30", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/30.png"),
        ("chay_to_bat_31", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/31.png"),
        ("chay_to_bat_32", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/32.png"),
        ("chay_to_bat_33", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/33.png"),
        ("chay_to_bat_34", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/34.png"),
        ("chay_to_bat_35", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/35.png"),
        ("chay_to_bat_36", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/36.png"),
        ("chay_to_bat_37", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/37.png"),
        ("chay_to_bat_38", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/38.png"),
        ("chay_to_bat_39", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/39.png"),
        ("chay_to_bat_40", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/40.png"),
        ("chay_to_bat_41", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/41.png"),
        ("chay_to_bat_42", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/42.png"),
        ("chay_to_bat_43", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/43.png"),
        ("chay_to_bat_44", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/44.png"),
        ("chay_to_bat_45", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/45.png"),
        ("chay_to_bat_46", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/46.png"),
        ("chay_to_bat_47", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/47.png"),
        ("chay_to_bat_48", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/48.png"),
        ("chay_to_bat_49", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/49.png"),
        ("chay_to_bat_50", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/50.png"),
        ("chay_to_bat_51", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/51.png"),
        ("chay_to_bat_52", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/52.png"),
        ("chay_to_bat_53", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/53.png"),
        ("chay_to_bat_54", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/54.png"),
        ("chay_to_bat_55", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/55.png"),
        ("chay_to_bat_56", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/56.png"),
        ("chay_to_bat_57", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/57.png"),
        ("chay_to_bat_58", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/58.png"),
        ("chay_to_bat_59", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/59.png"),
        ("chay_to_bat_60", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/60.png"),
        ("chay_to_bat_61", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/61.png"),
        ("chay_to_bat_62", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/62.png"),
        ("chay_to_bat_63", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/63.png"),
        ("chay_to_bat_64", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/64.png"),
        ("chay_to_bat_65", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/65.png"),
        ("chay_to_bat_66", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/66.png"),
        ("chay_to_bat_67", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/67.png"),
        ("chay_to_bat_68", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/68.png"),
        ("chay_to_bat_69", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/69.png"),
        ("chay_to_bat_70", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/70.png"),
        ("chay_to_bat_71", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/71.png"),
        ("chay_to_bat_72", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/72.png"),
        ("chay_to_bat_73", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/73.png"),
        ("chay_to_bat_74", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/74.png"),
        ("chay_to_bat_75", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/75.png"),
        ("chay_to_bat_76", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/76.png"),
        ("chay_to_bat_77", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/77.png"),
        ("chay_to_bat_78", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/78.png"),
        ("chay_to_bat_79", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/79.png"),
        ("chay_to_bat_80", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/80.png"),
        ("chay_to_bat_81", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/81.png"),
        ("chay_to_bat_82", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/82.png"),
        ("chay_to_bat_83", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/83.png"),
        ("chay_to_bat_84", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/84.png"),
        ("chay_to_bat_85", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/85.png"),
        ("chay_to_bat_86", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/86.png"),
        ("chay_to_bat_87", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/87.png"),
        ("chay_to_bat_88", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/88.png"),
        ("chay_to_bat_89", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/89.png"),
        ("chay_to_bat_90", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/90.png"),
        ("chay_to_bat_91", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/91.png"),
        ("chay_to_bat_92", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/92.png"),
        ("chay_to_bat_93", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/93.png"),
        ("chay_to_bat_94", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/94.png"),
        ("chay_to_bat_95", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/95.png"),
        ("chay_to_bat_96", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/96.png"),
        ("chay_to_bat_97", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/97.png"),
        ("chay_to_bat_98", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/98.png"),
        ("chay_to_bat_99", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/99.png"),
        ("chay_to_bat_100", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/100.png"),
        ("chay_to_bat_101", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/101.png"),
        ("chay_to_bat_102", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/102.png"),
        ("chay_to_bat_103", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/103.png"),
        ("chay_to_bat_104", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/104.png"),
        ("chay_to_bat_105", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/105.png"),
        ("chay_to_bat_106", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/106.png"),
        ("chay_to_bat_107", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/107.png"),
        ("chay_to_bat_108", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/108.png"),
        ("chay_to_bat_109", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/109.png"),
        ("chay_to_bat_110", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/110.png"),
        ("chay_to_bat_111", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/111.png"),
        ("chay_to_bat_112", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/112.png"),
        ("chay_to_bat_113", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/113.png"),
        ("chay_to_bat_114", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/114.png"),
        ("chay_to_bat_115", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/115.png"),
        ("chay_to_bat_116", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/116.png"),
        ("chay_to_bat_117", "Chày Tò Bò", "Tuồng Cổ", "http://localhost:8000/static/images/117.png"),
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
