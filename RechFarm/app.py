from flask import Flask, jsonify, render_template, request, redirect, url_for, session
import mysql.connector
import requests
from mysql.connector import Error
from datetime import datetime
import base64
import os

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your_secret_key')  # Use environment variable for security

# Database configuration
db_config = {
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'database': os.getenv('DB_DATABASE', 'rech')
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None

def get_access_token():
    auth_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    consumer_key = os.getenv('CONSUMER_KEY', 'Am48e6A0aF6x9VHryS1EAjN6D9ayF1b2Ek1q8U4A4vuIjGa6')
    consumer_secret = os.getenv('CONSUMER_SECRET', 'o1Wtusape4kULYOirENZsoUj9AFQgmXuKx1r0JenxC1XUFPh0h1DpYbpNhINztKP')
    
    try:
        response = requests.get(auth_url, auth=(consumer_key, consumer_secret))
        response.raise_for_status()
        token = response.json().get('access_token')
        return token
    except requests.RequestException as e:
        print(f'Failed to get access token: {e}')
        return None

def send_stk_push(phone_number, amount, callback_url):
    mpesa_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    
    access_token = get_access_token()
    if not access_token:
        return {"error": "Failed to get access token"}

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    shortcode = os.getenv('SHORTCODE', '174379')
    passkey = os.getenv('PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": str(phone_number),
        "PartyB": shortcode,
        "PhoneNumber": str(phone_number),
        "CallBackURL": callback_url,
        "AccountReference": "RechFarmOrder",
        "TransactionDesc": "Payment for Order"
    }

    try:
        response = requests.post(mpesa_url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"STK Push request failed: {e}")
        return {"error": str(e)}

@app.route('/your_callback_endpoint', methods=['POST'])
def your_callback_endpoint():
    data = request.get_json()
    # Process the data
    print(f"Callback data received: {data}")
    return jsonify({"status": "received"})

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cart')
def cart():
    cart_items = session.get('cart', [])
    total_price = sum(float(item['price']) * item['quantity'] for item in cart_items)
    return render_template('cart.html', cart_items=cart_items, total_price=total_price)

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    item_name = request.form.get('name')
    item_quantity = request.form.get('quantity', type=int)
    item_price = request.form.get('price')
    item_image = request.form.get('image')

    if item_name and item_quantity is not None:
        cart = session.get('cart', [])
        item_found = False
        
        for item in cart:
            if item['name'] == item_name:
                item['quantity'] += item_quantity
                item_found = True
                break
        
        if not item_found:
            cart.append({
                'name': item_name,
                'quantity': item_quantity,
                'price': item_price,
                'image': item_image
            })
        
        session['cart'] = cart
    
    return redirect(url_for('cart'))

@app.route('/update_cart', methods=['POST'])
def update_cart():
    item_name = request.form.get('name')
    new_quantity = request.form.get('quantity', type=int)
    
    if item_name and new_quantity is not None:
        cart = session.get('cart', [])
        
        for item in cart:
            if item['name'] == item_name:
                item['quantity'] = new_quantity
                break
        
        session['cart'] = cart
    
    return redirect(url_for('cart'))

@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    item_name = request.form.get('name')
    
    if item_name:
        cart = session.get('cart', [])
        cart = [item for item in cart if item['name'] != item_name]
        session['cart'] = cart
    
    return redirect(url_for('cart'))

@app.route('/checkout')
def checkout():
    cart_items = session.get('cart', [])
    total_price = sum(float(item['price']) * item['quantity'] for item in cart_items)
    return render_template('checkout.html', cart_items=cart_items, total_price=total_price)

@app.route('/order_confirmation', methods=['POST'])
def order_confirmation():
    cart_items = session.get('cart', [])
    total_price = sum(float(item['price']) * item['quantity'] for item in cart_items)
    payment_method = request.form.get('payment_method')
    mpesa_number = request.form.get('mpesa_number', '')

    if not cart_items:
        return redirect(url_for('checkout'))

    connection = get_db_connection()
    if connection is None:
        return redirect(url_for('checkout'))

    cursor = connection.cursor()

    try:
        cursor.execute("""
            INSERT INTO billing_info (first_name, last_name, phone, email, address, town_city, order_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            request.form['first_name'],
            request.form['last_name'],
            request.form['phone'],
            request.form['email'],
            request.form['address'],
            request.form['town_city'],
            None  # You might want to handle order_id appropriately
        ))

        connection.commit()

        billing_info = {
            'first_name': request.form['first_name'],
            'last_name': request.form['last_name'],
            'phone': request.form['phone'],
            'email': request.form['email'],
            'address': request.form['address'],
            'town_city': request.form['town_city']
        }
        session['billing_info'] = billing_info

        if payment_method == 'mpesa':
            # Use the Ngrok URL for the callback
            callback_url = 'https://35ca-41-90-37-115.ngrok-free.app/your_callback_endpoint'
            response = send_stk_push(mpesa_number, total_price, callback_url)
            return render_template('order_confirmation.html', cart_items=cart_items, total_price=total_price, payment_method=payment_method, response=response, billing_info=billing_info)
        else:
            return render_template('order_confirmation.html', cart_items=cart_items, total_price=total_price, payment_method=payment_method, billing_info=billing_info)

    except Error as e:
        print(f"Database error: {e}")
        connection.rollback()
        return redirect(url_for('checkout'))
    
    finally:
        cursor.close()
        connection.close()

@app.route('/product/<int:id>')
def product(id):
    return redirect(url_for('cart'))

if __name__ == '__main__':
    app.run(debug=True)
