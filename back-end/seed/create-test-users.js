use("webfashion");

const PASSWORD_HASH =
  "$2b$10$J6dwrrWBA9ni.sIv9JZlM.Ept/C69eWSDj3WQ7GFCwEJVbdujLmIK";

const users = [];

for (let i = 1; i <= 1000; i++) {
  users.push({
    email: `loadtest${i}@gmail.com`,
    passWord: PASSWORD_HASH,
    fullName: `Load Test User ${i}`,
    birthday: new Date("2000-01-01"),
    sex: i % 2 === 0 ? "male" : "female",
    role: "user",
    status: "active",
    avatar_url:
      "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg",
    addresses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

db.users.deleteMany({
  email: /^loadtest\d+@gmail\.com$/,
});

db.users.insertMany(users);

print(`Đã tạo ${users.length} tài khoản test.`);