import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
  Newspaper,
  Pin,
  PinOff,
  Pencil,
} from "lucide-react";
import { createNews, deleteNews, fetchNews, updateNews } from "../../api";

export default function NewsPanel() {
  const [newsList, setNewsList] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsForm, setNewsForm] = useState({
    title: "",
    body: "",
    category: "ایستگاه",
    pinned: false,
    image: null,
  });
  const [newsAddMode, setNewsAddMode] = useState(false);
  const [newsEditId, setNewsEditId] = useState(null);
  const [newsSaving, setNewsSaving] = useState(false);
  const newsImgRef = useRef(null);

  useEffect(() => {
    fetchNews()
      .then(setNewsList)
      .finally(() => setNewsLoading(false));
  }, []);

  const handleNewsImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setNewsForm((f) => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleNewsSave = async () => {
    if (!newsForm.title.trim() || !newsForm.body.trim()) return;
    setNewsSaving(true);
    try {
      if (newsEditId) {
        const updated = await updateNews(newsEditId, newsForm);
        setNewsList((prev) =>
          prev.map((n) => (n.id === newsEditId ? updated : n)),
        );
      } else {
        const created = await createNews(newsForm);
        setNewsList((prev) => [created, ...prev]);
      }
      setNewsForm({
        title: "",
        body: "",
        category: "ایستگاه",
        pinned: false,
        image: null,
      });
      setNewsAddMode(false);
      setNewsEditId(null);
    } finally {
      setNewsSaving(false);
    }
  };

  const handleNewsDelete = async (id) => {
    await deleteNews(id);
    setNewsList((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNewsTogglePin = async (item) => {
    const updated = await updateNews(item.id, { pinned: !item.pinned });
    setNewsList((prev) => prev.map((n) => (n.id === item.id ? updated : n)));
  };

  const handleNewsEdit = (item) => {
    setNewsForm({
      title: item.title,
      body: item.body,
      category: item.category,
      pinned: item.pinned,
      image: item.image,
    });
    setNewsEditId(item.id);
    setNewsAddMode(true);
  };

              const NEWS_CATS = ["ایستگاه", "شرکت", "تخفیف", "رویداد", "سایر"];
              return (
                <>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.95)",
                          marginBottom: 4,
                        }}
                      >
                        مدیریت اخبار
                      </div>
                      <div style={{ fontSize: 13, color: "#888" }}>
                        اخبار ایستگاه‌ها و شرکت ولت‌مپ را اینجا منتشر کنید
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setNewsAddMode(true);
                        setNewsEditId(null);
                        setNewsForm({
                          title: "",
                          body: "",
                          category: "ایستگاه",
                          pinned: false,
                          image: null,
                        });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 20px",
                        background: "#2ECC71",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Vazirmatn",
                      }}
                    >
                      <Plus size={16} /> خبر جدید
                    </button>
                  </div>

                  {/* فرم افزودن/ویرایش */}
                  {newsAddMode && (
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        border: "1px solid #eef0f3",
                        padding: 24,
                        marginBottom: 24,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1a1a1a",
                          marginBottom: 16,
                        }}
                      >
                        {newsEditId ? "ویرایش خبر" : "افزودن خبر جدید"}
                      </div>

                      {/* آپلود عکس */}
                      <div
                        onClick={() => newsImgRef.current?.click()}
                        style={{
                          border: "2px dashed #e0e0e0",
                          borderRadius: 12,
                          height: 140,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          marginBottom: 16,
                          overflow: "hidden",
                          position: "relative",
                          background: "#fafafa",
                        }}
                      >
                        {newsForm.image ? (
                          <>
                            <img
                              src={newsForm.image}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewsForm((f) => ({ ...f, image: null }));
                              }}
                              style={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "rgba(0,0,0,0.5)",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={14} color="#fff" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload size={24} color="#ccc" />
                            <span
                              style={{
                                fontSize: 12,
                                color: "#aaa",
                                marginTop: 8,
                              }}
                            >
                              کلیک کنید یا عکس را بکشید اینجا
                            </span>
                          </>
                        )}
                        <input
                          ref={newsImgRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleNewsImage}
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              color: "#888",
                              display: "block",
                              marginBottom: 6,
                            }}
                          >
                            عنوان خبر *
                          </label>
                          <input
                            value={newsForm.title}
                            onChange={(e) =>
                              setNewsForm((f) => ({
                                ...f,
                                title: e.target.value,
                              }))
                            }
                            placeholder="عنوان را وارد کنید"
                            style={{
                              width: "100%",
                              border: "1px solid #e8eaed",
                              borderRadius: 10,
                              padding: "9px 12px",
                              fontSize: 13,
                              fontFamily: "Vazirmatn",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              color: "#888",
                              display: "block",
                              marginBottom: 6,
                            }}
                          >
                            دسته‌بندی
                          </label>
                          <select
                            value={newsForm.category}
                            onChange={(e) =>
                              setNewsForm((f) => ({
                                ...f,
                                category: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 10,
                              padding: "9px 12px",
                              fontSize: 13,
                              fontFamily: "Vazirmatn",
                              outline: "none",
                              background: "rgba(255,255,255,0.06)",
                              color: "#1a1a1a",
                            }}
                          >
                            {NEWS_CATS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            fontSize: 12,
                            color: "#888",
                            display: "block",
                            marginBottom: 6,
                          }}
                        >
                          متن خبر *
                        </label>
                        <textarea
                          value={newsForm.body}
                          onChange={(e) =>
                            setNewsForm((f) => ({ ...f, body: e.target.value }))
                          }
                          rows={4}
                          placeholder="متن کامل خبر را بنویسید..."
                          style={{
                            width: "100%",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 10,
                            padding: "9px 12px",
                            fontSize: 13,
                            fontFamily: "Vazirmatn",
                            outline: "none",
                            resize: "vertical",
                            boxSizing: "border-box",
                            background: "rgba(255,255,255,0.06)",
                            color: "#1a1a1a",
                          }}
                        />
                      </div>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          marginBottom: 16,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newsForm.pinned}
                          onChange={(e) =>
                            setNewsForm((f) => ({
                              ...f,
                              pinned: e.target.checked,
                            }))
                          }
                        />
                        <span style={{ fontSize: 13, color: "#555" }}>
                          سنجاق کردن (نمایش در بالای لیست)
                        </span>
                      </label>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={handleNewsSave}
                          disabled={
                            newsSaving || !newsForm.title || !newsForm.body
                          }
                          style={{
                            flex: 1,
                            padding: "10px 0",
                            background: "#2ECC71",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "Vazirmatn",
                            opacity: newsSaving ? 0.7 : 1,
                          }}
                        >
                          {newsSaving
                            ? "در حال ذخیره..."
                            : newsEditId
                              ? "ذخیره تغییرات"
                              : "انتشار خبر"}
                        </button>
                        <button
                          onClick={() => {
                            setNewsAddMode(false);
                            setNewsEditId(null);
                          }}
                          style={{
                            padding: "10px 20px",
                            background: "#f5f5f5",
                            color: "#555",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 13,
                            cursor: "pointer",
                            fontFamily: "Vazirmatn",
                          }}
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  )}

                  {/* لیست اخبار */}
                  {newsLoading ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "#aaa",
                      }}
                    >
                      در حال بارگذاری...
                    </div>
                  ) : newsList.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 60,
                        background: "#fff",
                        borderRadius: 16,
                        border: "1px solid #eef0f3",
                      }}
                    >
                      <Newspaper
                        size={40}
                        color="#ddd"
                        style={{ margin: "0 auto 12px" }}
                      />
                      <p style={{ color: "#aaa", fontSize: 14 }}>
                        هنوز خبری منتشر نشده
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                      {newsList.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid #eef0f3",
                            overflow: "hidden",
                            display: "flex",
                            gap: 0,
                          }}
                        >
                          {item.image && (
                            <div
                              style={{
                                width: 140,
                                flexShrink: 0,
                                overflow: "hidden",
                              }}
                            >
                              <img
                                src={item.image}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1, padding: "16px 20px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 8,
                                marginBottom: 8,
                              }}
                            >
                              {item.pinned && (
                                <Pin
                                  size={14}
                                  color="#2ECC71"
                                  style={{ flexShrink: 0, marginTop: 2 }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#1a1a1a",
                                    marginBottom: 4,
                                  }}
                                >
                                  {item.title}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginBottom: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11,
                                      background: "#f0faf5",
                                      color: "#27AE60",
                                      padding: "2px 10px",
                                      borderRadius: 20,
                                    }}
                                  >
                                    {item.category}
                                  </span>
                                  <span style={{ fontSize: 11, color: "#aaa" }}>
                                    {new Date(
                                      item.publishedAt,
                                    ).toLocaleDateString("fa-IR")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p
                              style={{
                                fontSize: 13,
                                color: "#666",
                                lineHeight: 1.7,
                                marginBottom: 12,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {item.body}
                            </p>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => handleNewsEdit(item)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "6px 14px",
                                  background: "#f5f7fa",
                                  color: "#555",
                                  border: "none",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontFamily: "Vazirmatn",
                                }}
                              >
                                <Pencil size={13} /> ویرایش
                              </button>
                              <button
                                onClick={() => handleNewsTogglePin(item)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "6px 14px",
                                  background: item.pinned
                                    ? "#f0faf5"
                                    : "#f5f7fa",
                                  color: item.pinned ? "#27AE60" : "#555",
                                  border: "none",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontFamily: "Vazirmatn",
                                }}
                              >
                                {item.pinned ? (
                                  <>
                                    <PinOff size={13} /> رفع سنجاق
                                  </>
                                ) : (
                                  <>
                                    <Pin size={13} /> سنجاق
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleNewsDelete(item.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "6px 14px",
                                  background: "#fef2f2",
                                  color: "#e74c3c",
                                  border: "none",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontFamily: "Vazirmatn",
                                  marginRight: "auto",
                                }}
                              >
                                <Trash2 size={13} /> حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
}
