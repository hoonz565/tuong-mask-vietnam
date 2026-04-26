// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <section id="center">
//         <div className="hero">
//           <img src={heroImg} className="base" width="170" height="179" alt="" />
//           <img src={reactLogo} className="framework" alt="React logo" />
//           <img src={viteLogo} className="vite" alt="Vite logo" />
//         </div>
//         <div>
//           <h1>Get started</h1>
//           <p>
//             Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
//           </p>
//         </div>
//         <button
//           type="button"
//           className="counter"
//           onClick={() => setCount((count) => count + 1)}
//         >
//           Count is {count}
//         </button>
//       </section>

//       <div className="ticks"></div>

//       <section id="next-steps">
//         <div id="docs">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#documentation-icon"></use>
//           </svg>
//           <h2>Documentation</h2>
//           <p>Your questions, answered</p>
//           <ul>
//             <li>
//               <a href="https://vite.dev/" target="_blank">
//                 <img className="logo" src={viteLogo} alt="" />
//                 Explore Vite
//               </a>
//             </li>
//             <li>
//               <a href="https://react.dev/" target="_blank">
//                 <img className="button-icon" src={reactLogo} alt="" />
//                 Learn more
//               </a>
//             </li>
//           </ul>
//         </div>
//         <div id="social">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#social-icon"></use>
//           </svg>
//           <h2>Connect with us</h2>
//           <p>Join the Vite community</p>
//           <ul>
//             <li>
//               <a href="https://github.com/vitejs/vite" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#github-icon"></use>
//                 </svg>
//                 GitHub
//               </a>
//             </li>
//             <li>
//               <a href="https://chat.vite.dev/" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#discord-icon"></use>
//                 </svg>
//                 Discord
//               </a>
//             </li>
//             <li>
//               <a href="https://x.com/vite_js" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#x-icon"></use>
//                 </svg>
//                 X.com
//               </a>
//             </li>
//             <li>
//               <a href="https://bsky.app/profile/vite.dev" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#bluesky-icon"></use>
//                 </svg>
//                 Bluesky
//               </a>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <div className="ticks"></div>
//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VenetianMask } from 'lucide-react';
function App() {
  // Quản lý trạng thái dữ liệu
  const [masks, setMasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gọi API ngay khi trang web vừa tải xong
  useEffect(() => {
    fetch('http://localhost:8000/api/masks')
      .then(res => {
        if (!res.ok) throw new Error('Không thể kết nối với máy chủ');
        return res.json();
      })
      .then(data => {
        setMasks(data);
        setLoading(false); // Tắt hiệu ứng loading
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Thiết lập Animation cho danh sách (hiện lên lần lượt)
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 } // Khoảng trễ giữa các mặt nạ
    }
  };

  // Thiết lập Animation cho từng chiếc thẻ mặt nạ (trượt từ dưới lên)
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    // Nền trắng ngà (Gallery Style), chữ đen xám
    <div className="min-h-screen bg-[#F9F9F7] text-gray-900 font-sans p-8 md:p-16">
      
      {/* Phần Tiêu đề chính */}
      <header className="mb-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#8B0000]"
        >
          MẶT NẠ TUỒNG
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 italic"
        >
          Sưu tập qua các Nghệ nhân miền Trung
        </motion.p>
      </header>

      {/* Trạng thái Loading hoặc Lỗi */}
      {loading && <p className="text-center text-gray-500 animate-pulse">Đang tải dữ liệu từ bảo tàng...</p>}
      {error && <p className="text-center text-red-500 font-semibold">Lỗi: {error}</p>}

      {/* Khu vực hiển thị danh sách Mặt Nạ */}
      {!loading && !error && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 max-w-6xl mx-auto"
        >
          {masks.map((mask) => (
            <motion.div 
              variants={itemVariants} 
              key={mask.id} 
              className="group cursor-pointer flex flex-col items-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              {/* Khung chứa ảnh: Vì chưa có ảnh thật nên dùng Icon, khi hover sẽ đổi màu Đỏ */}
              <div className="w-32 h-32 mb-6 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:text-[#8B0000] group-hover:bg-red-50 transition-colors duration-500">
                <VenetianMask size={64} strokeWidth={1.5} />
              </div>
              
              {/* Thông tin Text */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 tracking-wide uppercase mb-2">
                  {mask.name}
                </h3>
                <p className="text-sm text-gray-500 italic">
                  {mask.category}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default App;