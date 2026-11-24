const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3001; // 注意：选择一个不同于前端开发服务器的端口
const SECRET_KEY = 'your_secret_key'; // 用于 JWT 签名

app.use(bodyParser.json());
app.use(cors());

// 创建 MySQL 连接池
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'geo_disaster_response'
});

// 用户注册 API
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // 检查用户名是否已经存在
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length > 0) return res.status(400).json({ message: '用户名已存在' });

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 8);

    // 插入新用户
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: '注册成功' });
    });
  });
});

// 用户登录 API
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 检查用户是否存在
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ message: '用户不存在' });

    const user = results[0];

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: '密码错误' });

    // 创建 JWT 令牌
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
  });
});

// JWT 验证中间件
const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(403).json({ message: '未提供令牌' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: '令牌无效' });

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// 示例受保护的 API
app.get('/protected', verifyToken, (req, res) => {
  res.status(200).json({ message: '访问受保护的资源成功', userId: req.userId, role: req.userRole });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
