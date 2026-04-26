from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sqlite3
import os

app = FastAPI(title="Vietnamese Tuong Mask API")

# Cấu hình CORS để frontend có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đường dẫn tới database
DB_PATH = os.path.join(os.path.dirname(__file__), 'masks.db')

# Mount thư mục static để phục vụ ảnh
# Đảm bảo thư mục static/images tồn tại
os.makedirs(os.path.join(os.path.dirname(__file__), 'static', 'images'), exist_ok=True)
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), 'static')), name="static")

@app.get("/api/masks")
async def get_masks():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Để trả về kết quả dạng dictionary
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM masks")
        masks = cursor.fetchall()
        return [dict(mask) for mask in masks]
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
