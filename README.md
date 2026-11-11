# CRM – Customer Relationship Management System

A full-stack Customer Relationship Management (CRM) application designed to help businesses manage customers, leads, sales opportunities, activities, and business relationships through a centralized dashboard.

Built using **React.js, Tailwind CSS, Django REST Framework, and PostgreSQL**.

<p align="center">
  <strong>Full-Stack CRM Application</strong><br/>
  <em>Streamlining Customer Relationships and Sales Management</em>
</p>

---

## Overview

The CRM System is a full-stack web application developed to simplify customer relationship management and improve sales workflow efficiency.

It provides a centralized platform where users can manage customer information, track potential leads, monitor sales opportunities, schedule activities, and analyze business performance.

The project follows a modular architecture with a React-based frontend and a Django REST Framework backend, designed with scalability, maintainability, and clean code practices in mind.

## Key Features

### Dashboard
- Centralized business overview.
- Key performance indicators (KPIs).
- Customer, lead, and opportunity statistics.
- Visual representation of business activities.

### Customer Management
- Create, view, update, and manage customer records.
- Maintain customer contact information.
- Organize customer-related information.

### Lead Management
- Track potential customers.
- Manage lead information and status.
- Monitor lead progression through the sales pipeline.

### Opportunity Management
- Manage sales opportunities.
- Track opportunity stages.
- Monitor potential deal values and progress.

### Activity Management
- Record calls, meetings, and emails.
- Associate activities with customers, leads, and opportunities.
- Track activity status.
- Prevent editing or deletion of cancelled activities.

### User Management
- Manage system users.
- Authentication and authorization.
- Role-based access control (planned/in development).

### Reports and Analytics
- Sales performance monitoring.
- Customer and lead analysis.
- Business activity reporting.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, JavaScript |
| Styling | Tailwind CSS |
| Backend | Python, Django |
| API | Django REST Framework |
| Database | PostgreSQL |
| Authentication | JWT (Simple JWT) |
| API Documentation | drf-spectacular / OpenAPI |
| HTTP Client | Axios |
| Routing | React Router |
| Charts | Recharts |
| Icons | Lucide React |
| Version Control | Git & GitHub |

## Project Architecture

```text
crm-system/
│
├── backend/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── customers/
│   │   ├── leads/
│   │   ├── opportunities/
│   │   └── activities/
│   │
│   ├── config/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   └── pages/
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

*Note: Directory structure may evolve as development progresses.*

---

## Getting Started

Follow these instructions to run the project locally.

### Prerequisites

Make sure you have installed:

- Python 3.12+
- Node.js and npm
- Git
- PostgreSQL (for PostgreSQL-based configuration)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/crm-system.git

cd crm-system
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```powershell
venv\Scripts\activate
```

**Linux/macOS:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Apply database migrations:

```bash
python manage.py migrate
```

Create a superuser:

```bash
python manage.py createsuperuser
```

Start the Django development server:

```bash
python manage.py runserver
```

Backend runs at:

`http://127.0.0.1:8000/`

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend runs at the local URL provided by Vite, usually:

`http://localhost:5173/`

---

## Environment Variables

Configure environment variables before connecting the application to a production database or deployment environment.

Example backend `.env`:

```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```

**Security Note:** Never commit your actual `.env` file, secret keys, database credentials, or other sensitive information to GitHub.

---

## Development Workflow

The project follows a modular development approach:

1. Define application requirements.
2. Design database models and relationships.
3. Implement backend APIs using Django REST Framework.
4. Develop reusable frontend components using React.
5. Integrate frontend and backend APIs.
6. Implement authentication and authorization.
7. Perform testing and debugging.
8. Prepare the application for deployment.

## Testing

Backend tests can be executed using:

```bash
python manage.py test
```

Frontend development and build verification:

```bash
npm run build
```

---

## Current Development Status

<em>Project is actively under development.</em>

- [x] Initial project setup
- [x] Django backend configuration
- [x] React frontend configuration
- [x] Initial application structure
- [x] Core database model development
- [ ] Backend API implementation
- [ ] Authentication and authorization
- [ ] Frontend-backend integration
- [ ] Dashboard analytics
- [ ] Automated testing
- [ ] Production deployment

*Update this checklist as individual features are completed and tested.*

---

## Future Improvements

- Advanced reporting and analytics.
- Sales forecasting.
- Email integration and notifications.
- Advanced search and filtering.
- Role-based permissions.
- Audit logs and activity tracking.
- Docker-based deployment.
- Cloud hosting and CI/CD integration.

## Learning Objectives

This project provides practical experience in:

- Full-stack web application development.
- RESTful API design and implementation.
- Relational database design.
- Authentication and authorization.
- Frontend component architecture.
- Backend modular architecture.
- Software testing and debugging.
- Git-based collaborative development.

## Author

**Gyanendra Lekhak**



Kathmandu, Nepal

- GitHub:(https://github.com/lekhak-30)
- LinkedIn:(www.linkedin.com/in/gyanendra-lekhak)

---

## License

This project is currently developed for educational and portfolio purposes.

A formal open-source license can be added when the distribution terms are decided.