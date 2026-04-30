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
        ("dich_loi", "Địch Lôi", "Kinh Kịch TQ", "http://localhost:8000/static/images/19.png"),
        ("diem_cuu_quy", "Diệm Cửu Quỳ", "Tuồng Đào Phi Phụng", "http://localhost:8000/static/images/20.png"),
        ("diem_cuu_quy2", "Diệm Cửu Quỳ", "Tuồng Đào Phi Phụng", "http://localhost:8000/static/images/21.png"),
        ("dong_kim_lan2", "Đổng Kim Lân (2)", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/22.png"),
        ("dong_mau", "Đổng Mẫu", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/23.png"),
        ("don_phung_tin", "Đơn Phùng Tín", "Tuồng Tống Tửu Đơn Hùng Tín", "http://localhost:8000/static/images/24.png"),
        ("du_hong", "Dư Hồng", "Tuồng Tam Hạ Nam Đường", "http://localhost:8000/static/images/25.png"),
        ("duong_pham", "Dương Phàm", "Tuồng Tiết Nhân Quý Chinh Tây", "http://localhost:8000/static/images/26.png"),
        ("duong_chan_tu", "Dương Chấn Tử", "Tuồng Dương Chấn Tử", "http://localhost:8000/static/images/27.png"),
        ("duong_Chan_tu2", "Dương Chấn Tử (2)", "Tuồng Dương Chấn Tử", "http://localhost:8000/static/images/28.png"),
        ("du_trieu", "Dư Triệu", "Tuồng Tam Hạ Nam Đường", "http://localhost:8000/static/images/29.png"),
        ("du_trieu2", "Dư Triệu (2)", "Tuồng Tam Hạ Nam Đường", "http://localhost:8000/static/images/30.png"),
        ("duong_luc_su", "Dương Lục Sứ", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/31.png"),
        ("hai_duong", "Hải Đường", "Tuồng Hải Đường Thạch Trúc", "http://localhost:8000/static/images/32.png"),
        ("ho_ly_tinh", "Hồ Ly Tinh", "Tuồng Trầm Hương Các", "http://localhost:8000/static/images/33.png"),
        ("ho_no", "Hồ Nô", "Tuồng Họ Sinh Đàn", "http://localhost:8000/static/images/34.png"),
        ("hua_chu", "Hứa Chử", "Tuồng Tam Quốc", "http://localhost:8000/static/images/35.png"),
        ("huat_tri_cung", "Huất Trì Cung", "Tuồng Tống Tửu Đơn Hùng Tín", "http://localhost:8000/static/images/36.png"),
        ("khong_minh", "Khổng Minh", "Tuồng Tam Quốc Chí", "http://localhost:8000/static/images/37.png"),
        ("khuong_linh_ta", "Khương Linh Tá", "Tuồng Sơn Hậu - Nam Bộ", "http://localhost:8000/static/images/38.png"),
        ("khuong_linh_ta2", "Khương Linh Tá (2)", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/39.png"),
        ("lao_chai", "Lão Chài", "Tuồng Hải Đường Thạch Trúc", "http://localhost:8000/static/images/40.png"),
        ("lao_tieu", "Lão Tiều", "Tuồng Hải Đường Thạch Trúc", "http://localhost:8000/static/images/41.png"),
        ("le_tu_trinh", "Lê Tử Trình", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/42.png"),
        ("lieu_nguyet_tiem", "Liễu Nguyệt Tiêm", "Tuồng Đào Phi Phụng", "http://localhost:8000/static/images/43.png"),
        ("lo_tri_tham", "Lỗ Trí Thâm", "Kinh Kịch Trung Quốc", "http://localhost:8000/static/images/44.png"),
        ("luu_khanh", "Lưu Khánh", "Tuồng Ngũ Hổ Bình Liêu", "http://localhost:8000/static/images/45.png"),
        ("luu_bi", "Lưu Bị", "Tuồng Tam Quốc Chí", "http://localhost:8000/static/images/46.png"),
        ("luu_hau", "Lưu Hậu", "Tuồng Xử Án Quách Hòe", "http://localhost:8000/static/images/47.png"),
        ("ly_huyen_minh", "Lý Huyền Minh", "Tuồng Võ Hùng Vương", "http://localhost:8000/static/images/48.png"),
        ("ly_khac_minh", "Lý Khắc Minh", "Tuồng Ngọn Lửa Hồng Sơn", "http://localhost:8000/static/images/49.png"),
        ("ly_phung_dinh_blue", "Lý Phụng Đình (Xanh)", "Tuồng Lý Phụng Đình", "http://localhost:8000/static/images/50.png"),
        ("ly_phung_dinh", "Lý Phụng Đình", "Tuồng Lý Phụng Đình", "http://localhost:8000/static/images/51.png"),
        ("manh_luong", "Mạnh Lương", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/52.png"),
        ("mac_loi_xuan", "Mạc Lôi Xuân", "", "http://localhost:8000/static/images/53.png"),
        ("mang_xa_vuong", "Mãng Xà Vương", "Kinh Kịch Trung Quốc", "http://localhost:8000/static/images/54.png"),
        ("mao_at", "Mao Ất", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/55.png"),
        ("ngo_ton_quyen", "Ngô Tôn Quyền", "Tuồng Tam Quốc", "http://localhost:8000/static/images/56.png"),
        ("ngo_ton_quyen2", "Ngô Tôn Quyền (2)", "Tuồng Nam Bộ", "http://localhost:8000/static/images/57.png"),
        ("nhat_dien", "Nhất Điện", "Tuồng Giác Oan", "http://localhost:8000/static/images/58.png"),
        ("nguu_dau", "Ngưu Đầu", "Tuồng Tiết Nhân Quý Chinh Tây", "http://localhost:8000/static/images/59.png"),
        ("phan_dinh_cong", "Phàn Định Công", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/60.png"),
        ("phan_dinh_cong2", "Phàn Định Công (2)", "Tuồng Nam Bộ", "http://localhost:8000/static/images/61.png"),
        ("phan_diem", "Phàn Diệm", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/62.png"),
        ("phan_diem2", "Phàn Diệm (2)", "Tuồng Nam Bộ", "http://localhost:8000/static/images/63.png"),
        ("phan_phung_co", "Phàn Phụng Cơ", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/64.png"),
        ("phien_con_1", "Phiên Con 1", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/65.png"),
        ("phien_con_2", "Phiên Con 2", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/66.png"),
        ("phien_tuan", "Phiên Tuần", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/67.png"),
        ("quach_an_cong", "Quách An Công", "Tuồng Võ Hùng Vương", "http://localhost:8000/static/images/68.png"),
        ("quan_cong", "Quan Công", "Tuồng Tam Quốc", "http://localhost:8000/static/images/69.png"),
        ("quan_hoi", "Quản Hợi", "", "http://localhost:8000/static/images/70.png"),
        ("sam_di", "Sằm Di", "Tuồng Ngũ Hổ Bình Liêu", "http://localhost:8000/static/images/71.png"),
        ("trinh_giao_kim", "Trình Giảo Kim", "Tuồng Nam Bộ", "http://localhost:8000/static/images/72.png"),
        ("ta_on_dinh", "Tạ Ôn Đình", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/73.png"),
        ("ta_on_dinh2", "Tạ Ôn Đình (2)", "Tuồng Nam Bộ", "http://localhost:8000/static/images/74.png"),
        ("tao_thao", "Tào Tháo", "Tuồng Tam Quốc", "http://localhost:8000/static/images/75.png"),
        ("ta_ho_giao", "Tạ Hồ Giao", "Tuồng Dương Chấn Tử", "http://localhost:8000/static/images/76.png"),
        ("ta_kim_hung", "Tạ Kim Hùng", "Tuồng Ngọn Lửa Hồng Sơn", "http://localhost:8000/static/images/77.png"),
        ("ta_loi_nhuoc", "Tạ Lôi Nhược", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/78.png"),
        ("ta_loi_phong", "Tạ Lôi Phong", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/79.png"),
        ("tan_thuc_bao", "Tần Thúc Bảo", "Tuồng Tống Tửu Đơn Hùng Tín", "http://localhost:8000/static/images/80.png"),
        ("ta_ngoc_lan", "Tạ Ngọc Lân", "Tuồng Ngọn Lửa Hồng Sơn", "http://localhost:8000/static/images/81.png"),
        ("tao_thao2", "Tào Tháo (2)", "Tuồng Nam Bộ", "http://localhost:8000/static/images/82.png"),
        ("ta_thien_lang", "Tạ Thiên Lăng", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/83.png"),
        ("thach_hung", "Thạch Hùng", "Tuồng Vạn Bửu", "http://localhost:8000/static/images/84.png"),
        ("thach_ho_tinh", "Thạch Hồ Tinh", "Tuồng Dương Chấn Tử", "http://localhost:8000/static/images/85.png"),
        ("thach_su_tu", "Thạch Sư Tử", "", "http://localhost:8000/static/images/86.png"),
        ("thach_truc", "Thạch Trúc", "Tuồng Vạn Bửu", "http://localhost:8000/static/images/87.png"),
        ("thach_xu", "Thạch Xu", "Tuồng Vạn Bửu", "http://localhost:8000/static/images/88.png"),
        ("thai_loi", "Thái Lôi", "Tuồng Lý Phụng Đình", "http://localhost:8000/static/images/89.png"),
        ("thai_ngan", "Thái Ngan", "Tuồng Lý Phụng Đình", "http://localhost:8000/static/images/90.png"),
        ("thay_boi", "Thầy Bói", "", "http://localhost:8000/static/images/91.png"),
        ("thay_ngheu", "Thầy Nghêu", "Tuồng Nghêu, Sò, Ốc, Hến", "http://localhost:8000/static/images/92.png"),
        ("thich_ma", "Thích Ma", "Tuồng Hải Đường Thạch Trúc", "http://localhost:8000/static/images/93.png"),
        ("tiet_cuong", "Tiết Cương", "", "http://localhost:8000/static/images/94.png"),
        ("tieu_huu", "Tiêu Hữu", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/95.png"),
        ("tieu_tan", "Tiêu Tán", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/96.png"),
        ("toong_luong", "Toòng Luông", "Tuồng Dương Lục Sứ", "http://localhost:8000/static/images/97.png"),
        ("trieu_bich_long", "Triệu Bích Long", "Tuồng Ngọn Lửa Hồng Sơn", "http://localhost:8000/static/images/98.png"),
        ("trieu_dinh_long", "Triệu Đình Long", "", "http://localhost:8000/static/images/99.png"),
        ("trieu_khac_thuong", "Triệu Khắc Thường", "Tuồng Sơn Hậu", "http://localhost:8000/static/images/100.png"),
        ("trieu_khuon_dan", "Triệu Khuôn Dẫn", "Tuồng Nam Bộ", "http://localhost:8000/static/images/101.png"),
        ("trieu_tu_cung", "Triệu Tư Cung", "Tuồng Ngọn Lửa Hồng Sơn", "http://localhost:8000/static/images/102.png"),
        ("trieu_van_hoan", "Triệu Văn Hoán", "Tuồng Ngọn Lửa Hồng Sơn", "http://localhost:8000/static/images/103.png"),
        ("trinh_an", "Trịnh Ân", "Tuồng Trảm Trịnh Ân", "http://localhost:8000/static/images/104.png"),
        ("trinh_an2", "Trịnh Ân (2)", "Tuồng Nam Bộ", "http://localhost:8000/static/images/105.png"),
        ("trinh_giao_kim2", "Trình Giảo Kim (2)", "Tuồng Tống Tửu Đơn Hùng Tín", "http://localhost:8000/static/images/106.png"),
        ("tru_vuong", "Trụ Vương", "", "http://localhost:8000/static/images/107.png"),
        ("trum_so", "Trùm Sò", "Tuồng Nghêu, Sò, Ốc, Hến", "http://localhost:8000/static/images/108.png"),
        ("truong_phi", "Trương Phi", "Tuồng Nam Bộ", "http://localhost:8000/static/images/109.png"),
        ("vien_hoa_ngan", "Viên Hòa Ngạn", "Tuồng Võ Hùng Vương", "http://localhost:8000/static/images/110.png"),
        ("vien_trong_oai", "Viên Trọng Oai", "Tuồng Võ Hùng Vương", "http://localhost:8000/static/images/111.png"),
        ("vo_hung_vuong", "Võ Hùng Vương", "Tuồng Võ Hùng Vương", "http://localhost:8000/static/images/112.png"),
        ("vo_van_thanh_do", "Võ Văn Thành Đô", "Tuồng Nam Bộ", "http://localhost:8000/static/images/113.png"),
        ("vu_tac", "Vu Tắc", "Tuồng Võ Hùng Vương", "http://localhost:8000/static/images/114.png"),
        ("xich_my_lao_to", "Xích My Lão Tổ", "Tuồng Tam Hạ Nam Đường", "http://localhost:8000/static/images/115.png"),
        ("phan_dinh_cong3", "Phàn Định Công (3)", "", "http://localhost:8000/static/images/116.png"),
        ("ta_on_dinh3", "Tạ Ôn Đình (3)", "", "http://localhost:8000/static/images/117.png"),
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
