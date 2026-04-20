# SafeNet-IDS
An Intrusion Detection System (IDS) is a security mechanism that monitors network traffic or system activities to detect suspicious behavior and generate alerts. This project aims to develop a Mini Intrusion Detection System that can monitor network traffic in real-time and detect potential intrusions using predefined detection rules.

**Problem Statement
**
Many small organizations and individual users lack affordable and simple security monitoring tools. Existing IDS solutions are often complex and expensive.

There is a need for a lightweight, cost-effective, and easy-to-implement intrusion detection system that can:

Monitor network traffic

Identify suspicious activities

Generate alerts in real-time

**Methodology
**
The project will follow a rule-based detection approach.

Step 1: Packet Capture

Network packets will be captured using Python libraries such as Scapy.

Step 2: Packet Analysis

Each packet will be analyzed to extract important fields:

Source IP

Destination IP

Protocol

Port numbers

Step 3: Rule Engine

Detection rules will be applied:

If one IP accesses multiple ports quickly → Port scanning alert.

If excessive packets are received from one IP → DoS alert.

If IP matches blacklist → Suspicious activity alert.

Step 4: Alert Generation

If any rule is triggered:

Display alert message.

Log the event in a file or database.
