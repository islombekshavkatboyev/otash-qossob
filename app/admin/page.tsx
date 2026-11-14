'use client';

import { useState, useEffect } from 'react';
import {
  Product, SiteSettings, Order, Review,
  defaultProducts, defaultSettings, ORDER_STATUSES,
} from '../data/products';
import {
  getProducts, saveProducts, getSettings, saveSettings,
  getOrders, updateOrderStatus, deleteOrder,
  getReviews, deleteReview,
  formatWeight, calcItemPrice, formatDate,
} from '../lib/storage';
import Link from 'next/link';
import styles from './admin.module.css';

type Tab = 'products' | 'orders' | 'reviews' | 'delivery' | 'settings';

export default function AdminPage() {
  const [activeTab, setActiveTab]    = useState<Tab>('products');
  const [products, setProducts]      = useState<Product[]>(defaultProducts);
  const [settings, setSettings]      = useState<SiteSettings>(defaultSettings);
  const [orders, setOrders]          = useState<Order[]>([]);
  const [reviews, setReviews]        = useState<Review[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'product' | 'service'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saved, setSaved]            = useState(false);
  const [newProduct, setNewProduct]  = useState<Partial<Product>>({
    name: '', description: '', price: 0,
    image: '', category: 'mol', unit: 'kg', inStock: true,
  });

  useEffect(() => {
    setProducts(getProducts());
    setSettings(getSettings());
    setOrders(getOrders());
    setReviews(getReviews());
  }, []);

  // Buyurtmalarni refresh qilish
  const refreshOrders = () => setOrders(getOrders());
  const refreshReviews = () => setReviews(getReviews());

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const fmt = (n: number) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // ─── Products ───────────────────────────────────────────
  const handleSaveProducts = () => { saveProducts(products); showSaved(); };

  const handlePriceChange = (id: string, price: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, price } : p));
  };

  const handleStockToggle = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p));
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Mahsulotni o'chirmoqchimisiz?")) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveProducts(updated);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name || '',
      nameUz: newProduct.name || '',
      description: newProduct.description || '',
      price: newProduct.price || 0,
      image: newProduct.image || 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
      category: newProduct.category || 'mol',
      unit: 'kg',
      inStock: newProduct.inStock ?? true,
    };
    const updated = [...products, product];
    setProducts(updated);
    saveProducts(updated);
    setShowAddForm(false);
    setNewProduct({ name: '', description: '', price: 0, image: '', category: 'mol', unit: 'kg', inStock: true });
    showSaved();
  };

  const handleResetAll = () => {
    if (confirm("Barcha ma'lumotlarni asl holatiga qaytarmoqchimisiz?")) {
      setProducts(defaultProducts);
      setSettings(defaultSettings);
      saveProducts(defaultProducts);
      saveSettings(defaultSettings);
      showSaved();
    }
  };

  // ─── Orders ─────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: Order['status']) => {
    updateOrderStatus(id, status);
    refreshOrders();
    try {
      await fetch('/api/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status }),
      });
    } catch {}
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm("Buyurtmani o'chirmoqchimisiz?")) {
      deleteOrder(id);
      refreshOrders();
    }
  };

  const newOrdersCount = orders.filter(o => o.status === 'new').length;

  // ─── Reviews ────────────────────────────────────────────
  const handleDeleteReview = (id: string) => {
    if (confirm("Ushbu izohni o'chirmoqchimisiz?")) {
      deleteReview(id);
      refreshReviews();
      showSaved();
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const countByStar = (star: number) => reviews.filter(r => r.rating === star).length;

  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === 'product') return r.targetType === 'product';
    if (reviewFilter === 'service') return r.targetType === 'service';
    return true;
  });

  // ─── Settings ───────────────────────────────────────────
  const handleSaveSettings = () => { saveSettings(settings); showSaved(); };

  const tabs = [
    { id: 'products' as Tab, label: 'Mahsulotlar',        icon: '🥩' },
    { id: 'orders'   as Tab, label: 'Buyurtmalar',        icon: '📦', badge: newOrdersCount },
    { id: 'reviews'  as Tab, label: 'Izohlar va Baholar', icon: '⭐', badge: reviews.length },
    { id: 'delivery' as Tab, label: 'Yetkazib berish',    icon: '🚗' },
    { id: 'settings' as Tab, label: 'Sozlamalar',         icon: '⚙️' },
  ];

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <span>🥩</span>
            <div>
              <div className={styles.sidebarLogoMain}>Halol Go'sht</div>
              <div className={styles.sidebarLogoSub}>Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.sidebarBtn} ${activeTab === tab.id ? styles.sidebarBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`tab-${tab.id}`}
            >
              <span className={styles.sidebarBtnIcon}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge ? <span className={styles.tabBadge}>{tab.badge}</span> : null}
              {activeTab === tab.id && <span className={styles.sidebarActiveIndicator} />}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.sidebarBackBtn}>← Saytga qaytish</Link>
          <button
            className={styles.sidebarLogoutBtn}
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
          >
            🚪 Chiqish
          </button>
          <button className={styles.sidebarResetBtn} onClick={handleResetAll}>
            🔄 Aslga qaytarish
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.adminMain}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>
              {tabs.find(t => t.id === activeTab)?.icon}{' '}
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className={styles.pageSubtitle}>
              {activeTab === 'products' && `${products.length} ta mahsulot`}
              {activeTab === 'orders'   && `${orders.length} ta buyurtma (${newOrdersCount} ta yangi)`}
              {activeTab === 'reviews'  && `${reviews.length} ta mijoz fikri va bahosi`}
              {activeTab === 'delivery' && 'Yetkazib berish sozlamalari'}
              {activeTab === 'settings' && 'Umumiy sozlamalar'}
            </p>
          </div>
          {saved && <div className={styles.savedNotif}>✅ Saqlandi!</div>}
        </div>

        {/* ═══ PRODUCTS TAB ═══ */}
        {activeTab === 'products' && (
          <div className={styles.tabContent}>
            <div className={styles.tabActions}>
              <button className={styles.addBtn} onClick={() => setShowAddForm(!showAddForm)} id="add-product-btn">
                {showAddForm ? '✕ Yopish' : "+ Mahsulot qo'shish"}
              </button>
              <button className={styles.saveBtn} onClick={handleSaveProducts} id="save-products-btn">
                💾 Saqlash
              </button>
            </div>

            {showAddForm && (
              <div className={styles.addForm}>
                <h3 className={styles.formTitle}>Yangi mahsulot qo'shish</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nomi *</label>
                    <input className={styles.formInput} type="text" placeholder="Mahsulot nomi"
                      value={newProduct.name}
                      onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Narxi (so'm/kg) *</label>
                    <input className={styles.formInput} type="number" placeholder="130000"
                      value={newProduct.price || ''}
                      onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kategoriya</label>
                    <select className={styles.formSelect}
                      value={newProduct.category}
                      onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    >
                      <option value="mol">Mol go'shti</option>
                      <option value="qoy">Qo'y go'shti</option>
                      <option value="tovuq">Tovuq</option>
                      <option value="qiyma">Qiyma</option>
                      <option value="kabob">Kaboblik</option>
                      <option value="suyakli">Suyakli</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mavjudligi</label>
                    <select className={styles.formSelect}
                      value={newProduct.inStock ? 'true' : 'false'}
                      onChange={e => setNewProduct({ ...newProduct, inStock: e.target.value === 'true' })}
                    >
                      <option value="true">✓ Mavjud</option>
                      <option value="false">✗ Tugagan</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.formLabel}>Tavsif</label>
                    <textarea className={styles.formTextarea}
                      placeholder="Mahsulot haqida ma'lumot..."
                      value={newProduct.description}
                      onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.formLabel}>Rasm URL</label>
                    <input className={styles.formInput} type="url" placeholder="https://..."
                      value={newProduct.image}
                      onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button className={styles.saveBtn} onClick={handleAddProduct}>✅ Qo'shish</button>
                  <button className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>Bekor qilish</button>
                </div>
              </div>
            )}

            <div className={styles.productsTable}>
              {products.map(product => (
                <div key={product.id} className={styles.productRow} id={`admin-product-${product.id}`}>
                  <div className={styles.productRowLeft}>
                    <img src={product.image} alt={product.name} className={styles.productRowImg} />
                    <div className={styles.productRowInfo}>
                      <div className={styles.productRowName}>{product.name}</div>
                      <div className={styles.productRowCat}>
                        <span className={styles.catBadge}>{product.category}</span>
                        <span className={`${styles.stockBadge} ${product.inStock ? styles.inStock : styles.outStock}`}>
                          {product.inStock ? '✓ Mavjud' : '✗ Tugagan'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.productRowRight}>
                    <div className={styles.priceEdit}>
                      <label className={styles.priceEditLabel}>Narx (so'm/kg)</label>
                      <input className={styles.priceInput} type="number"
                        value={product.price}
                        onChange={e => handlePriceChange(product.id, Number(e.target.value))}
                      />
                    </div>
                    <div className={styles.productRowActions}>
                      <button
                        className={`${styles.toggleBtn} ${product.inStock ? styles.toggleActive : ''}`}
                        onClick={() => handleStockToggle(product.id)}
                        title={product.inStock ? 'Tugagan deb belgilash' : 'Mavjud deb belgilash'}
                      >
                        {product.inStock ? '✓' : '✗'}
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(product.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.saveSection}>
              <button className={styles.saveBtn} onClick={handleSaveProducts} id="save-products-bottom">
                💾 Barcha o'zgarishlarni saqlash
              </button>
            </div>
          </div>
        )}

        {/* ═══ ORDERS TAB ═══ */}
        {activeTab === 'orders' && (
          <div className={styles.tabContent}>
            {orders.length === 0 ? (
              <div className={styles.emptyOrders}>
                <span>📦</span>
                <p>Hozircha buyurtmalar yo'q</p>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map(order => {
                  const st = ORDER_STATUSES[order.status];
                  return (
                    <div key={order.id} className={`${styles.orderCard} ${order.status === 'new' ? styles.orderNew : ''}`}>
                      {/* Order header */}
                      <div className={styles.orderHeader}>
                        <div className={styles.orderIdWrap}>
                          <span className={styles.orderId}>{order.id}</span>
                          <span className={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleString('uz-UZ', {
                              day: '2-digit', month: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className={styles.orderStatusBadge} style={{ background: st.color + '22', border: `1px solid ${st.color}44`, color: st.color }}>
                          {st.emoji} {st.label}
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className={styles.orderInfo}>
                        <div className={styles.orderInfoItem}>
                          <span>👤</span>
                          <span>{order.customerName}</span>
                        </div>
                        <div className={styles.orderInfoItem}>
                          <span>📞</span>
                          <a href={`tel:${order.phone}`} className={styles.orderPhone}>{order.phone}</a>
                        </div>
                        <div className={styles.orderInfoItem}>
                          <span>{order.deliveryType === 'delivery' ? '🏠' : '🏪'}</span>
                          <span>{order.address}</span>
                        </div>
                        <div className={styles.orderInfoItem}>
                          <span>💳</span>
                          <span>{order.paymentType === 'cash' ? 'Naqd pul' : 'Karta'}</span>
                        </div>
                        {order.location && (
                          <div className={styles.orderInfoItem}>
                            <span>📍</span>
                            <a
                              href={order.location.mapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.orderPhone}
                            >
                              GPS: {order.location.lat.toFixed(4)}, {order.location.lng.toFixed(4)} →
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className={styles.orderItems}>
                        {order.items.map((item, i) => (
                          <div key={i} className={styles.orderItem}>
                            <span>{item.product.name}</span>
                            <span className={styles.orderItemWeight}>{formatWeight(item.weightG)}</span>
                            <span className={styles.orderItemPrice}>{fmt(calcItemPrice(item.product.price, item.weightG))} so'm</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className={styles.orderTotals}>
                        <div className={styles.orderTotalRow}>
                          <span>Mahsulotlar:</span>
                          <span>{fmt(order.totalPrice)} so'm</span>
                        </div>
                        {order.deliveryPrice > 0 && (
                          <div className={styles.orderTotalRow}>
                            <span>Yetkazib berish:</span>
                            <span>{fmt(order.deliveryPrice)} so'm</span>
                          </div>
                        )}
                        <div className={`${styles.orderTotalRow} ${styles.orderGrandTotal}`}>
                          <span>JAMI:</span>
                          <span>{fmt(order.totalPrice + order.deliveryPrice)} so'm</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={styles.orderActions}>
                        <select
                          className={styles.statusSelect}
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value as Order['status'])}
                        >
                          {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                            <option key={key} value={key}>{val.emoji} {val.label}</option>
                          ))}
                        </select>
                        <a href={`tel:${order.phone}`} className={styles.callBtn}>📞 Qo'ng'iroq</a>
                        <button className={styles.deleteOrderBtn} onClick={() => handleDeleteOrder(order.id)}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ REVIEWS TAB ═══ */}
        {activeTab === 'reviews' && (
          <div className={styles.tabContent}>
            {/* Overview / Rating summary */}
            <div className={styles.reviewsOverview}>
              <div className={styles.ratingSummaryCard}>
                <div className={styles.ratingBigNumber}>{avgRating}</div>
                <div className={styles.ratingBigStars}>
                  {'★'.repeat(Math.round(Number(avgRating))) + '☆'.repeat(5 - Math.round(Number(avgRating)))}
                </div>
                <div className={styles.ratingSubText}>Jami {reviews.length} ta fikr asosida</div>
              </div>

              <div className={styles.ratingBreakdownCard}>
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = countByStar(stars);
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} className={styles.ratingBarRow}>
                      <span className={styles.ratingBarLabel}>{stars} ★</span>
                      <div className={styles.ratingBarTrack}>
                        <div className={styles.ratingBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.ratingBarCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter buttons */}
            <div className={styles.reviewFilterTabs}>
              <button
                className={`${styles.reviewFilterBtn} ${reviewFilter === 'all' ? styles.reviewFilterBtnActive : ''}`}
                onClick={() => setReviewFilter('all')}
              >
                Barchasi ({reviews.length})
              </button>
              <button
                className={`${styles.reviewFilterBtn} ${reviewFilter === 'product' ? styles.reviewFilterBtnActive : ''}`}
                onClick={() => setReviewFilter('product')}
              >
                🥩 Mahsulotlar ({reviews.filter(r => r.targetType === 'product').length})
              </button>
              <button
                className={`${styles.reviewFilterBtn} ${reviewFilter === 'service' ? styles.reviewFilterBtnActive : ''}`}
                onClick={() => setReviewFilter('service')}
              >
                ⭐ Xizmat ({reviews.filter(r => r.targetType === 'service').length})
              </button>
            </div>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>💬</span>
                <h3>Hozircha fikrlar yo'q</h3>
                <p>Mijozlar qoldirgan izoh va baholar bu yerda ko'rinadi.</p>
              </div>
            ) : (
              <div className={styles.reviewsList}>
                {filteredReviews.map(r => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewMain}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewUserAvatar}>
                          {r.userName ? r.userName.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div className={styles.reviewUserName}>{r.userName}</div>
                        <span className={styles.reviewTargetBadge}>
                          {r.targetType === 'product' ? `🥩 ${r.targetName || 'Mahsulot'}` : '⭐ Umumiy xizmat'}
                        </span>
                        <span className={styles.reviewDate} suppressHydrationWarning>
                          {formatDate(r.createdAt)}
                        </span>
                      </div>
                      <div className={styles.reviewStars}>
                        {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                      </div>
                      <div className={styles.reviewComment}>{r.comment}</div>
                    </div>
                    <button
                      className={styles.reviewDeleteBtn}
                      title="O'chirish"
                      onClick={() => handleDeleteReview(r.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ DELIVERY TAB ═══ */}
        {activeTab === 'delivery' && (
          <div className={styles.tabContent}>
            <div className={styles.settingsGrid}>
              {/* Samarqand zone */}
              {(settings.deliverySettings.zones || []).map((zone, idx) => (
                <div key={zone.id} className={styles.settingsCard}>
                  <div className={styles.settingsCardIcon}>{zone.id === 'samarqand' ? '🏙️' : '🌿'}</div>
                  <h3 className={styles.settingsCardTitle}>{zone.name}</h3>
                  <div className={styles.settingsFields}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Yetkazib berish narxi (so'm)</label>
                      <input className={styles.formInput} type="number" min="0"
                        value={zone.price}
                        onChange={e => {
                          const zones = [...settings.deliverySettings.zones];
                          zones[idx] = { ...zones[idx], price: Number(e.target.value) };
                          setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, zones } });
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Bepul yetkazishdan (so'm)</label>
                      <input className={styles.formInput} type="number" min="0"
                        value={zone.freeFrom}
                        onChange={e => {
                          const zones = [...settings.deliverySettings.zones];
                          zones[idx] = { ...zones[idx], freeFrom: Number(e.target.value) };
                          setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, zones } });
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Min vaqt (daqiqa)</label>
                      <input className={styles.formInput} type="number" min="1"
                        value={zone.minTime}
                        onChange={e => {
                          const zones = [...settings.deliverySettings.zones];
                          zones[idx] = { ...zones[idx], minTime: Number(e.target.value) };
                          setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, zones } });
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Maks vaqt (daqiqa)</label>
                      <input className={styles.formInput} type="number" min="1"
                        value={zone.maxTime}
                        onChange={e => {
                          const zones = [...settings.deliverySettings.zones];
                          zones[idx] = { ...zones[idx], maxTime: Number(e.target.value) };
                          setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, zones } });
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.previewBox}>
                    <span className={styles.previewIcon}>👁️</span>
                    <span>Narx: <strong className={styles.previewText}>{fmt(zone.price)} so'm</strong></span>
                    <span>| Bepul: <strong className={styles.previewText}>{fmt(zone.freeFrom)} so'mdan</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.saveSection}>
              <button className={styles.saveBtn} onClick={handleSaveSettings}>💾 Saqlash</button>
            </div>
          </div>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            <div className={styles.settingsGrid}>
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardIcon}>📞</div>
                <h3 className={styles.settingsCardTitle}>Aloqa ma'lumotlari</h3>
                <div className={styles.settingsFields}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Telefon raqami</label>
                    <input className={styles.formInput} type="tel"
                      value={settings.phone}
                      onChange={e => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Telegram havolasi</label>
                    <input className={styles.formInput} type="url"
                      value={settings.telegram}
                      onChange={e => setSettings({ ...settings, telegram: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Manzil</label>
                    <input className={styles.formInput} type="text"
                      value={settings.address}
                      onChange={e => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ish vaqti</label>
                    <input className={styles.formInput} type="text"
                      value={settings.workingHours}
                      onChange={e => setSettings({ ...settings, workingHours: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.settingsCard}>
                <div className={styles.settingsCardIcon}>🤖</div>
                <h3 className={styles.settingsCardTitle}>Telegram Bot (buyurtmalar)</h3>
                <div className={styles.settingsFields}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bot Token</label>
                    <input className={styles.formInput} type="text"
                      placeholder="1234567890:ABC..."
                      value={settings.telegramBotToken || ''}
                      onChange={e => setSettings({ ...settings, telegramBotToken: e.target.value })}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      @BotFather orqali oling
                    </span>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Chat ID</label>
                    <input className={styles.formInput} type="text"
                      placeholder="-1001234567890"
                      value={settings.telegramChatId || ''}
                      onChange={e => setSettings({ ...settings, telegramChatId: e.target.value })}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      @userinfobot orqali oling
                    </span>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bot Username</label>
                    <input className={styles.formInput} type="text"
                      placeholder="halolgoshtyetkazishbot"
                      value={settings.telegramBotUsername || ''}
                      onChange={e => setSettings({ ...settings, telegramBotUsername: e.target.value.replace(/^@/, '') })}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      @ belgisiz (masalan: halolgoshtyetkazishbot)
                    </span>
                  </div>
                </div>

                <div className={styles.previewBox} style={{ marginTop: '16px', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔑</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {settings.telegramBotToken ? '✅ Token kiritilgan' : '❌ Token kiritilmagan'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💬</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {settings.telegramChatId ? '✅ Chat ID kiritilgan' : '❌ Chat ID kiritilmagan'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🤖</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {settings.telegramBotUsername ? `✅ @${settings.telegramBotUsername}` : '❌ Username kiritilmagan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className={styles.statsCard}>
                <h3 className={styles.settingsCardTitle}>📊 Statistika</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statNum}>{products.length}</span>
                    <span className={styles.statLabel}>Mahsulotlar</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNum}>{orders.length}</span>
                    <span className={styles.statLabel}>Buyurtmalar</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNum}>{newOrdersCount}</span>
                    <span className={styles.statLabel}>Yangi buyurtmalar</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNum}>
                      {orders.filter(o => o.status === 'done').length}
                    </span>
                    <span className={styles.statLabel}>Bajarilganlar</span>
                  </div>
                </div>

                <div className={styles.quickLinks}>
                  <h4>Tezkor havolalar</h4>
                  <a href={`tel:${settings.phone}`} className={styles.quickLink}>📞 {settings.phone}</a>
                  <a href={settings.telegram} target="_blank" rel="noopener noreferrer" className={styles.quickLink}>✈️ Telegram</a>
                  <Link href="/" className={styles.quickLink}>🌐 Saytni ko'rish</Link>
                </div>
              </div>
            </div>

            <div className={styles.saveSection}>
              <button className={styles.saveBtn} onClick={handleSaveSettings}>💾 Saqlash</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
