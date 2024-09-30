document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('product-modal');
    const modalImage = document.getElementById('modal-image');
    const modalName = document.getElementById('modal-name');
    const modalDescription = document.getElementById('modal-description');
    const modalPrice = document.getElementById('modal-price');
    const totalPriceElement = document.getElementById('total-price');
    const decrementBtn = document.getElementById('decrement-btn');
    const incrementBtn = document.getElementById('increment-btn');
    const quantityInput = document.getElementById('quantity');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const span = document.getElementsByClassName('close')[0];
    const cartItemsContainer = document.getElementById('cart-items-dropdown');
    const cartTotalPrice = document.getElementById('cart-total-price-dropdown');
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const viewCartBtn = document.getElementById('view-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    let currentPrice = 0;
    let cart = [];
  
    // Update total price
    function updateTotalPrice() {
        const quantity = parseInt(quantityInput.value);
        const totalPrice = quantity * currentPrice;
        totalPriceElement.textContent = `Ksh ${totalPrice}`;
    }
  
    // Decrement quantity
    decrementBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value);
        if (quantity > 1) {
            quantity--;
            quantityInput.value = quantity;
            updateTotalPrice();
        }
    });
  
    // Increment quantity
    incrementBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value);
        quantity++;
        quantityInput.value = quantity;
        updateTotalPrice();
    });
  
    // Update total price when quantity input changes
    quantityInput.addEventListener('input', function() {
        if (quantityInput.value < 1) {
            quantityInput.value = 1;
        }
        updateTotalPrice();
    });
  
    // Show the modal when a product is clicked
    document.querySelectorAll('.product').forEach(function(product) {
        product.addEventListener('click', function() {
            const image = product.querySelector('img').src;
            const name = product.querySelector('h3').textContent; // Corrected to 'h3' for product name
            const description = product.querySelector('p').textContent; // Corrected to 'p' for product description
            const price = product.querySelector('.price').textContent.replace('Ksh ', ''); // Corrected to '.price' for price
            currentPrice = parseFloat(price);
            modalImage.src = image;
            modalName.textContent = name;
            modalDescription.textContent = description;
            modalPrice.textContent = `Price: Ksh ${price}`;
            quantityInput.value = 1;
            updateTotalPrice();
            modal.style.display = 'block';
        });
    });
  
    // Close the modal
    span.addEventListener('click', function() {
        modal.style.display = 'none';
    });
  
    // Close the modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
  
    // Add item to cart
    buyNowBtn.addEventListener('click', function() {
        const quantity = parseInt(quantityInput.value);
        const totalPrice = quantity * currentPrice;
        const product = {
            image: modalImage.src,
            name: modalName.textContent,
            price: currentPrice,
            quantity: quantity,
            totalPrice: totalPrice
        };
        cart.push(product);
        modal.style.display = 'none';
        updateCart(); // Call function to update cart display
    });
  
    // Update the cart dropdown
    function updateCart() {
        cartItemsContainer.innerHTML = '';
        let totalCartPrice = 0;
        cart.forEach(function(item, index) {
            totalCartPrice += item.totalPrice;
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>Price: Ksh ${item.price}</p>
                    <div class="cart-item-quantity">
                        <button class="decrement-btn" data-index="${index}">-</button>
                        <input type="number" value="${item.quantity}" min="1" data-index="${index}">
                        <button class="increment-btn" data-index="${index}">+</button>
                    </div>
                    <p>Total: Ksh ${item.totalPrice}</p>
                </div>
                <button class="remove-item-btn" data-index="${index}">&times;</button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
        cartTotalPrice.textContent = `Ksh ${totalCartPrice}`;
        cartCount.textContent = cart.length;
        if (cart.length > 0) {
            emptyCartMessage.style.display = 'none';
            cartItemsContainer.style.display = 'block';
            cartTotalPrice.parentElement.style.display = 'block';
        } else {
            emptyCartMessage.style.display = 'block';
            cartItemsContainer.style.display = 'none';
            cartTotalPrice.parentElement.style.display = 'none';
        }
        attachCartEventListeners();
    }
  
    // Attach event listeners to cart items
    function attachCartEventListeners() {
        document.querySelectorAll('.remove-item-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const index = parseInt(btn.getAttribute('data-index'));
                cart.splice(index, 1);
                updateCart();
            });
        });
        document.querySelectorAll('.increment-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const index = parseInt(btn.getAttribute('data-index'));
                cart[index].quantity++;
                cart[index].totalPrice = cart[index].quantity * cart[index].price;
                updateCart();
            });
        });
        document.querySelectorAll('.decrement-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const index = parseInt(btn.getAttribute('data-index'));
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                    cart[index].totalPrice = cart[index].quantity * cart[index].price;
                    updateCart();
                }
            });
        });
        document.querySelectorAll('.cart-item-quantity input').forEach(function(input) {
            input.addEventListener('input', function() {
                const index = parseInt(input.getAttribute('data-index'));
                if (input.value < 1) {
                    input.value = 1;
                }
                cart[index].quantity = parseInt(input.value);
                cart[index].totalPrice = cart[index].quantity * cart[index].price;
                updateCart();
            });
        });
    }
  
    // Show cart dropdown
    cartIcon.addEventListener('click', function() {
        const dropdown = document.getElementById('cart-dropdown');
        if (dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        } else {
            dropdown.style.display = 'block';
        }
    });
  
    // Hide cart dropdown when clicking outside of it
    window.addEventListener('click', function(event) {
        if (!event.target.closest('#cart-icon') && !event.target.closest('#cart-dropdown')) {
            document.getElementById('cart-dropdown').style.display = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Event listener for "View Cart" button
    const viewCartBtn = document.getElementById('view-cart-btn');
    viewCartBtn.addEventListener('click', function() {
        window.location.href = 'cart.html'; // Redirect to cart.html
    });

    // Other JavaScript code for your page
});

document.addEventListener('DOMContentLoaded', function() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Function to add product to cart
    function addToCart(product) {
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }

    // Event listener for "Add to Cart" buttons
    document.querySelectorAll('.btn-color-1').forEach(button => {
        button.addEventListener('click', function() {
            const productElement = this.closest('.product');
            const product = {
                name: productElement.dataset.name,
                price: productElement.dataset.price,
                description: productElement.dataset.description,
                image: productElement.dataset.image,
                quantity: 1
            };
            addToCart(product);
        });
    });

    // Function to update cart count in the icon
    function updateCartCount() {
        const cartCount = cart.length;
        document.getElementById('cart-count').innerText = cartCount;
    }

    // Update cart count on page load
    updateCartCount();
});
  // Function to save cart to localStorage
  function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Function to load cart from localStorage
function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart(); // Update cart display after loading from localStorage
    }
}

// Load cart from localStorage on page load
loadCartFromLocalStorage();

// Event listener for "View Cart" button
viewCartBtn.addEventListener('click', function() {
    window.location.href = 'cart.html';
});