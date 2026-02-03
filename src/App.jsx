import axios from "axios";
import "./assets/style.css";
import * as bootstrap from "bootstrap";
import { useEffect, useRef, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;
//宣告原api產品資料的屬性 提供後續使用
const INITAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
}

//建立表單元件
function App() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isAuth, setIsAuth] = useState(false);
  //產品列表
  const [products, setProducts] = useState([]);
  //產品資料模板
  const [templateProduct, setTemplateProduct] = useState(INITAL_TEMPLATE_DATA);
  //modal類型 新增 編輯 刪除
  const [modalType, setModalType] = useState("")

  //modal元件參考
  const productModalRef = useRef(null);
  //表單輸入變更
  const handleInputChange = (e) => {
    const { name, value, } = e.target;
    setFormData((preData) => ({
      ...preData,
      [name]: value
    }));
  };
  //modal輸入變更
  const handleModalInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTemplateProduct((preData) => ({
      ...preData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  //modal多圖輸入變更
  const handleModalImageChange = (index, value) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage[index] = value;
      return {
        ...pre,
        imagesUrl: newImage
      }
    });
  }

  const handleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.push("");
      return {
        ...pre,
        imagesUrl: newImage
      }
    });
  }

  const handleRemoveImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop();
      return {
        ...pre,
        imagesUrl: newImage
      }
    });
  }

  //取得產品列表
  const getProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      //  console.log('產品列表', response.data.products);
      setProducts(response.data.products);
    } catch (error) {
      console.error(error.response);
    }
  }

  //新增或更新產品
  const upateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = 'post';
    if (modalType === 'edit') {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = 'put';
    }
    //新增產品做整理並送出資料
    const productData = {
      data: {
        ...templateProduct,
        //確保數字格式正確與圖片陣列不含空字串
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        //轉換布林值為數字 1 0
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        //防呆處理圖片空陣列
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== "")]
      }
    };
    try {
      const response = await axios[method](url, productData);
      console.log(response.data);
      getProducts();
      closeModal();
    } catch (error) {
      console.error(error.response);
    }
  }

  //刪除產品
  const delProduct = async (id) => {
    try {
      let response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`)
      console.log(response.data);
      getProducts();
      closeModal();
    } catch (error) {
      console.error(error.response);
    }
  }


  //送出表單
  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      // console.log('登入成功', response.data);
      const { token, expired } = response.data;
      document.cookie = `hexToken=${token}; expires=${new Date(expired)};`;
      axios.defaults.headers.common['Authorization'] = token;
      //取得產品列表
      getProducts();
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
      console.error('登入失敗', error.response);

    }
  }

  //1.登入狀態檢查
  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];
    //取得token後設定預設headers
    if (token) { axios.defaults.headers.common['Authorization'] = token; }
    //初始化 Modal
    productModalRef.current = new bootstrap.Modal('#productModal', {
      keyboard: false
    });

    const checkLogin = async () => {
      try {
        //確認是否登入
        const response = await axios.post(`${API_BASE}/api/user/check`);
        console.log(response.data);
        setIsAuth(true);
        //取得產品列表
        getProducts();
      } catch (error) {
        console.log(error.response?.data.message);
      }
    }
    checkLogin();

  }, []);

  //bootstrap打開 Modal用show方法
  //設定編輯按鈕資料與開啟產品列表為空陣列
  const openModal = (type, product) => {
    setModalType(type);
    setTemplateProduct((pre) => ({ ...pre, ...product }));
    productModalRef.current.show();
  }
  const closeModal = () => {
    productModalRef.current.hide();
  }


  return (
    <>
      {!isAuth ? (
        <div className='container login mt-3'>
          <h1 className='text-center'>請先登入</h1>
          <form className="form-floating" onSubmit={(e) =>
            onSubmit(e)
          }>
            <div className="form-floating mb-3">
              <input type="email" className="form-control" name="username" placeholder="name@example.com" value={formData.username} onChange={(e) => handleInputChange(e)} />
              <label htmlFor="fusername">Email address</label>
            </div>
            <div className="form-floating">
              <input type="password" className="form-control" name="password" placeholder="Password" value={formData.password} onChange={(e) => handleInputChange(e)} />
              <label htmlFor="password">Password</label>
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-3">登入</button>
          </form>
        </div >) : (
        <div className="container">
          <h2>產品列表</h2>
          <div className="text-end mt-4">
            <button
              type="button"
              //綁定開啟 Modal 事件
              className="btn btn-primary" onClick={() => openModal("create", INITAL_TEMPLATE_DATA)}
            >
              建立新的產品
            </button>
          </div>

          <table className="table table-hover">
            <thead >
              <tr className="text-center">
                <th scope="col">分類</th>
                <th scope="col" className="text-success" >產品名稱</th>
                <th scope="col" className="text-success">原價</th>
                <th scope="col" className="text-success">售價</th>
                <th scope="col" className="text-success">是否啟用</th>
                <th scope="col" className="text-success">編輯</th>
              </tr>
            </thead>
            <tbody>
              {
                products.map(product => (
                  <tr className="text-center" key={product.id}>
                    <td>{product.category}</td>
                    <td>{product.title}</td>
                    <td>{product.origin_price}</td>
                    <td>{product.price}</td>
                    {/* 當前條件運算式會在 product.is_enabled 為 true 時，啟用顯示綠色 */}
                    <td className={`${product.is_enabled && 'text-success'}`}>{product.is_enabled ? "啟用" : "未啟用"}</td>
                    <td>
                      <div className="btn-group" role="group" aria-label="Basic example">
                        {/* 綁定開啟 Modal 事件並傳入當前產品資料 */}
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => openModal('edit', product)}>編輯</button>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => openModal('delete', product)} >刪除</button>
                      </div>
                    </td>
                  </tr>
                ))
              }

            </tbody>
          </table>
        </div>

      )
      }


      <div className="modal fade" id="productModal" tabIndex="-1" aria-labelledby="productModalLabel" aria-hidden="true" ref={productModalRef}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'dark'} text-white`}>
              <h5 id="productModalLabel" className="modal-title">
                <span >{modalType === 'delete' ? '刪除' : modalType === 'edit' ? '編輯' : '新增'}產品</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {
                modalType === 'delete' ? (
                  <p className="fs-4 text-center">
                    確定要刪除
                    <span className="text-danger">{templateProduct.title}</span>嗎？
                  </p>
                ) : (<div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder="請輸入圖片連結"
                          value={templateProduct.imageUrl}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      {/* 先判斷是否有圖片網址，有的話就顯示圖片 */}
                      {templateProduct.imageUrl && (
                        <img className="img-fluid" src={templateProduct.imageUrl} alt="主圖" />)}
                    </div>
                    <div>
                      {templateProduct.imagesUrl.map((url, index) => (<div key={index}>
                        <label htmlFor="imageUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`圖片網址${index + 1}`}
                          value={url}
                          onChange={(e) => handleModalImageChange(index, e.target.value)}
                        />
                        {url && <img
                          className="img-fluid"
                          src={url}
                        // alt={`副圖${index + 1}`}
                        />}

                      </div>))}
                      {templateProduct.imagesUrl.length < 5 && templateProduct.imagesUrl[templateProduct.imagesUrl.length - 1] !== "" &&
                        <button className="btn btn-outline-primary btn-sm d-block w-100 mt-3 " type="button" onClick={() => handleAddImage()}>
                          新增圖片
                        </button>
                      }
                    </div>
                    <div className="mt-2">
                      {templateProduct.imagesUrl.length >= 1 && (<button className="btn btn-outline-danger btn-sm d-block w-100" type="button" onClick={() => handleRemoveImage()}>
                        刪除圖片
                      </button>)

                      }

                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">標題</label>
                      <input
                        name="title"
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={templateProduct.title}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">分類</label>
                        <input
                          name="category"
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={templateProduct.category}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">單位</label>
                        <input
                          name="unit"
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={templateProduct.unit}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">原價</label>
                        <input
                          name="origin_price"
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={templateProduct.origin_price}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">售價</label>
                        <input
                          name="price"
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={templateProduct.price}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">產品描述</label>
                      <textarea
                        name="description"
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">說明內容</label>
                      <textarea
                        name="content"
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          name="is_enabled"
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={templateProduct.is_enabled}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                        <label className="form-check-label" htmlFor="is_enabled">
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                )
              }

            </div>
            <div className="modal-footer">
              {modalType === 'delete' ? (<button
                type="button"
                className="btn btn-danger"
                onClick={() => delProduct(templateProduct.id)}
              >
                刪除
              </button>) : (
                <><button
                  type="button"
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                  onClick={() => closeModal()}
                >
                  取消
                </button>
                  <button type="button" className="btn btn-primary" onClick={() => upateProduct(templateProduct.id)}>確認</button>
                </>
              )

              }

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App

