from flask import Flask, session, redirect, url_for, escape, request, render_template, flash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import and_
from sqlalchemy import func
from sqlalchemy import exc

from sqlalchemy.exc import IntegrityError
import json


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
db = SQLAlchemy(app)

app.secret_key = "this is a terrible secret key"


###########################################################################################
#                           Model For Application                                         #
###########################################################################################

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=False, unique=True)
    limit = db.Column(db.Integer, nullable=False)

    def __init__(self, name, limit):
        self.name = name
        self.limit = limit

    def __repr__(self):
        return '<Category %r %r %r>' % (self.id, self.name, self.limit)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "limit": self.limit
        }


class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cat_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    name = db.Column(db.String(30), nullable=False)
    cost = db.Column(db.Integer, nullable=False)

    def __init__(self, cat_id, name, cost):
        self.cat_id = cat_id
        self.name = name
        self.cost = cost

    def __repr__(self):
        return '<Purchase = %r %r %r %r>' % (self.id, self.room_id, self.sender_id, self.sender_name)

    def as_dict(self):
        return {
            "id": self.id,
            "room_id": self.room_id,
            "sender_id": self.sender_id,
            "sender_name": self.sender_name,
            "message": self.message,
            "time": self.time
        }


@app.cli.command('initdb')
def initdb_command():
    db.drop_all()
    db.create_all()

    default_cat = Category('Uncategorized', 0)
    db.session.add(default_cat)
    db.session.commit()

    print('Initialized database.')


###########################################################################################
#                                Category Controller                                      #
###########################################################################################

def add_category(new_cat_name, limit):
    cat_exists = Category.query.filter_by(name=new_cat_name).first()
    if not cat_exists:
        try:
            new_cat = Category(new_cat_name, limit)
            db.session.add(new_cat)
            db.session.commit()
            return True
        except exc.SQLAlchemyError:
            pass

    return False


def remove_category(selected_cat):
    cat_exists = Category.query.filter_by(name=selected_cat).first()
    if cat_exists:
        try:
            db.session.delete(cat_exists)
            db.session.commit()
            return True
        except exc.SQLAlchemyError:
            pass

    return False


def get_category(selected_cat_name):
    cat_exists = Category.query.filter_by(name=selected_cat_name).first().as_dict()
    if cat_exists:
        return {
            'name': cat_exists['name'],
            'limit': cat_exists['limit'],
            'purchases': get_purchases_by_cat(selected_cat_name)
        }

    return {}


def get_all_categories():
    try:
        return [x.as_dict() for x in Category.query.all()]
    except exc.SQLAlchemyError:
        return {}


###########################################################################################
#                                Purchase Controller                                      #
###########################################################################################

def add_purchase(name, category, cost):
    cat_id = Category.query.filter_by(name=category).first().id
    if cat_id:
        try:
            p = Purchase(cat_id, name, cost)
            db.session.add(p)
            db.session.commit()
            return True
        except exc.SQLAlchemyError:
            pass

    return False


def remove_purchase(p_id):
    p = Purchase.query.filter_by(id=p_id).first()
    if purchase:
        try:
            db.session.delete(p)
            db.session.commit()
            return True
        except exc.SQLAlchemyError:
            pass

    return False


def get_all_purchases():
    try:
        return [x.as_dict() for x in Purchase.query.all()]
    except exc.SQLAlchemyError:
        return {}


def get_purchase_by_id(cat_id):
    try:
        return [x.as_dict() for x in Purchase.query.filter_by(id=cat_id).all()]
    except exc.SQLAlchemyError:
        return {}


def get_purchases_by_cat(cat_name):
    try:
        cat_id = Category.query.filter_by(name=cat_name).first().id
        return [x.as_dict() for x in Purchase.query.filter_by(cat_id=cat_id).all()]
    except exc.SQLAlchemyError:
        return {}

###########################################################################################
#                                    Routes                                               #
###########################################################################################


@app.route("/")
def skeleton():
    pass


@app.route("/cats", methods=["GET", "DELETE", "POST"])
def cat():

    if request.method == 'GET':
        if 'cat' in request.args:
            return {
                'category': get_category(request.args['cat'])
            }
        else:
            return {
                'categories': get_all_categories()
            }
    elif request.method == 'DELETE' and 'cat' in request.args:
        return {
            'completed': remove_category(request.args.get('cat'))
        }
    elif request.method == 'POST' and 'new_cat_name' in request.json and 'cat_limit' in request.json:
        return {
            'completed': add_category(request.json['new_cat_name'], request.json['cat_limit'])
        }


@app.route("/purchases")
def purchase():
    if request.method == 'GET':
        if 'cat' in request.args:
            return {
                'purchases': get_purchases_by_cat(request.args.get('cat'))
            }
        elif 'id' in request.args:
            return {
                'purchase': get_purchase_by_id(request.args.get('id'))
            }
        else:
            return {
                'purchase': get_all_purchases()
            }
    elif request.method == 'DELETE' and 'id' in request.args:
        return {
            'completed': remove_purchase(request.args.get('id'))
        }

    elif request.method == 'POST' and 'name' in request.json and 'category' in request.json and 'cost' in request.json:
        return {
            'completed': add_purchase(request.json['name'], request.json['category'], request.json['cost'])
        }


if __name__ == '__main__':
    app.run()
