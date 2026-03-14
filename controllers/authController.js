const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");

// LOGIN USER - Now returns Access Token + Refresh Token
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email=?";

  db.query(sql, [email], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // Generate Access Token (short lived + contains role) and Refresh Token (long lived)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  });
};
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1. Check if user already exists
    const checkUser = "SELECT * FROM users WHERE email = ? OR phone = ?";

    db.query(checkUser, [email, phone], async (err, result) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });

      if (result.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // 2. Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users (name, email, phone, password)
        VALUES (?, ?, ?, ?)
      `;

      // 3. Insert user into Database
      db.query(sql, [name, email, phone, hashedPassword], (err, insertResult) => {
        if (err) return res.status(500).json({ message: "Error creating user", error: err });

        // 4. GET THE NEWLY CREATED USER DETAILS
        // We need the ID and Role (which usually defaults in DB) to generate tokens
        const userId = insertResult.insertId;
        
        // Fetching the user to ensure we have the default 'role' from DB
        const fetchSql = "SELECT id, name, role FROM users WHERE id = ?";
        
        db.query(fetchSql, [userId], (err, userRows) => {
          if (err || userRows.length === 0) {
            return res.status(500).json({ message: "User created but failed to fetch details" });
          }

          const newUser = userRows[0];

          // 5. GENERATE TOKENS (Same as Login)
          const accessToken = generateAccessToken(newUser);
          const refreshToken = generateRefreshToken(newUser);

          // 6. SEND SAME RESPONSE AS LOGIN
          res.json({
            message: "User registered successfully",
            accessToken,
            refreshToken,
            user: {
              id: newUser.id,
              name: newUser.name,
              role: newUser.role,
            },
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// REGISTER USER (unchanged)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // check existing user
    const checkUser = "SELECT * FROM users WHERE email = ? OR phone = ?";

    db.query(checkUser, [email, phone], async (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users (name,email,phone,password)
        VALUES (?, ?, ?, ?)
      `;

      db.query(sql, [name, email, phone, hashedPassword], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "User registered successfully",
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// REFRESH TOKEN - New endpoint using Refresh Token to issue new Access Token + new Refresh Token (rotation)
exports.refreshToken = (req, res) => {
  
  // १. क्लायंटकडून (Frontend) आलेला 'refreshToken' काढून घेणे.
  const { refreshToken } = req.body;

  // २. जर रिफ्रेश टोकन पाठवले नसेल, तर एरर देणे.
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    // ३. JWT लायब्ररी वापरून टोकनची सत्यता तपासणे (Verify).
    // इथे 'JWT_REFRESH_SECRET' वापरला जातो जो टोकन सुरक्षित ठेवतो.
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // ४. टोकन बरोबर असेल, तर त्यातील 'id' वापरून डेटाबेसमध्ये युजर शोधणे.
    const sql = "SELECT id, name, role FROM users WHERE id = ?";
    db.query(sql, [decoded.id], (err, result) => {
      
      // ५. जर डेटाबेसमध्ये एरर आली किंवा युजर सापडला नाही (उदा. युजर डिलीट झाला असेल).
      if (err || result.length === 0) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      const user = result[0];

      // ६. 'Token Rotation' - ही सर्वात महत्त्वाची पायरी आहे.
      // जुना टोकन वापरून नवीन Access Token आणि एक नवीन Refresh Token तयार करणे.
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // ७. नवीन तयार झालेले दोन्ही टोकन्स फ्रंटएंडला परत पाठवणे.
      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });
  } catch (error) {
    // ८. जर रिफ्रेश टोकन स्वतः एक्सपायर झाले असेल किंवा चुकीचे असेल (Invalid).
    // इथे ४०१ स्टेटस कोड पाठवल्यामुळे फ्रंटएंड युजरला लॉग-आउट करून लॉग-इन पेजवर पाठवू शकते.
    return res.status(401).json({ message: "Refresh token expired" });
  }
};